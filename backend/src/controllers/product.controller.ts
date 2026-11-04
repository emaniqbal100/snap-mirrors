import { Request, Response } from 'express';
import { config } from '../config/env.js';
import { uploadBufferToCloudinary } from '../config/cloudinary.js';
import {
  findAllProducts,
  findProductById,
  findProductBySlug,
  createProduct as createProductModel,
  updateProduct as updateProductModel,
  updateProductSortOrder,
  deleteProduct as deleteProductModel,
  createVariant,
  deleteVariantsByProductId,
  ProductSpecification,
} from '../models/Product.js';
import { findCategoryBySlug, getCategoryAndDescendantIds } from '../models/Category.js';
import { slugify } from '../utils/helpers.js';
import { sanitizeDescription, MAX_DESCRIPTION_LENGTH } from '../utils/sanitizeHtml.js';
import {
  sendSuccess,
  sendValidationError,
  sendNotFound,
  sendServerError,
} from '../utils/response.js';

// ============================================
// PUBLIC
// ============================================

// GET /api/products
//   ?category=<slug>  optional. A main category slug returns its own products plus those of all
//                     its sub-categories; a sub-category slug returns only that sub-category.
export async function listProductsPublic(req: Request, res: Response) {
  try {
    let categoryIds: number[] | undefined;
    if (typeof req.query.category === 'string' && req.query.category.trim() !== '') {
      const category = await findCategoryBySlug(req.query.category.trim());
      if (!category) {
        return sendSuccess(res, [], 'Products fetched successfully');
      }
      categoryIds = await getCategoryAndDescendantIds(category.id);
    }
    const products = await findAllProducts(true, categoryIds);
    return sendSuccess(res, products, 'Products fetched successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to fetch products', error);
  }
}

export async function getProductBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const product = await findProductBySlug(slug);
    if (!product || !product.is_active) {
      return sendNotFound(res, 'Product not found');
    }
    return sendSuccess(res, product, 'Product fetched successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to fetch product', error);
  }
}

// ============================================
// ADMIN
// ============================================

export async function listProductsAdmin(req: Request, res: Response) {
  try {
    const products = await findAllProducts(false);
    return sendSuccess(res, products, 'Products fetched successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to fetch products', error);
  }
}

export async function getProductById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const product = await findProductById(parseInt(id, 10));
    if (!product) {
      return sendNotFound(res, 'Product not found');
    }
    return sendSuccess(res, product, 'Product fetched successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to fetch product', error);
  }
}

function parseDiscountPrice(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function parseBool(value: unknown): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return undefined;
}

// Reads a field that arrives either as an array (JSON body) or as a JSON string (multipart form).
// Returns undefined when the field was not sent, so updates leave it untouched.
function readJsonField(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (typeof value === 'string') {
    if (value.trim() === '') return [];
    return JSON.parse(value);
  }
  return value;
}

// specifications: [{ label, value }]  e.g. { label: "Fabric", value: "Cambric Cotton" }
function parseSpecifications(value: unknown): ProductSpecification[] | undefined | 'invalid' {
  let raw: unknown;
  try {
    raw = readJsonField(value);
  } catch {
    return 'invalid';
  }
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw) || raw.length > 20) return 'invalid';
  const result: ProductSpecification[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') return 'invalid';
    const label = String((item as any).label ?? '').trim().slice(0, 60);
    const val = String((item as any).value ?? '').trim().slice(0, 300);
    if (label && val) result.push({ label, value: val });
  }
  return result;
}

// highlights: ["Breathable and lightweight feel", ...]
function parseHighlights(value: unknown): string[] | undefined | 'invalid' {
  let raw: unknown;
  try {
    raw = readJsonField(value);
  } catch {
    return 'invalid';
  }
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw) || raw.length > 12) return 'invalid';
  return raw
    .filter((h): h is string => typeof h === 'string')
    .map((h) => h.trim().slice(0, 200))
    .filter((h) => h !== '');
}

async function resolveImages(req: Request): Promise<string[] | undefined> {
  let urlImages: string[] = [];

  if (typeof req.body.images === 'string' && req.body.images.trim() !== '') {
    try {
      const parsed = JSON.parse(req.body.images);
      if (Array.isArray(parsed)) urlImages = parsed.filter((u) => typeof u === 'string' && u.trim());
    } catch {
      // ignore malformed JSON
    }
  } else if (Array.isArray(req.body.images)) {
    urlImages = req.body.images.filter((u: unknown) => typeof u === 'string' && (u as string).trim());
  }

  const uploadedFiles = (req.files as Express.Multer.File[] | undefined) ?? (req.file ? [req.file] : []);

  let uploadedUrls: string[] = [];
  if (uploadedFiles.length > 0) {
    uploadedUrls = await Promise.all(
      uploadedFiles.map((file) => uploadBufferToCloudinary(file.buffer, 'products'))
    );
  }

  const combined = [...urlImages, ...uploadedUrls];

  if (combined.length === 0 && urlImages.length === 0 && uploadedUrls.length === 0 && req.body.images === undefined) {
    return undefined;
  }
  return combined;
}

// POST /api/admin/products
export async function createProduct(req: Request, res: Response) {
  try {
    const { name, base_price, discount_price, category_id, variants,
            is_new_arrival, is_shop_now, is_shop_collection, sort_order } = req.body;

    if (!name || base_price === undefined) {
      return sendValidationError(res, 'Name and base_price are required');
    }

    if (req.body.description !== undefined && typeof req.body.description !== 'string') {
      return sendValidationError(res, 'description must be text');
    }
    if (typeof req.body.description === 'string' && req.body.description.length > MAX_DESCRIPTION_LENGTH) {
      return sendValidationError(res, 'description is too long');
    }
    const description =
      typeof req.body.description === 'string' ? sanitizeDescription(req.body.description) : undefined;

    const parsedDiscount = parseDiscountPrice(discount_price);
    if (parsedDiscount !== null && parsedDiscount !== undefined && parsedDiscount >= Number(base_price)) {
      return sendValidationError(res, 'Discount price must be lower than base price');
    }

    const specifications = parseSpecifications(req.body.specifications);
    const highlights = parseHighlights(req.body.highlights);
    if (specifications === 'invalid') {
      return sendValidationError(res, 'specifications must be a list of { label, value } (max 20)');
    }
    if (highlights === 'invalid') {
      return sendValidationError(res, 'highlights must be a list of text lines (max 12)');
    }

    const images = await resolveImages(req);

    const slug = slugify(name);

    const product = await createProductModel({
      name,
      slug,
      description,
      base_price,
      discount_price: parsedDiscount ?? null,
      category_id,
      images,
      specifications,
      highlights,
      is_new_arrival: parseBool(is_new_arrival) ?? false,
      is_shop_now: parseBool(is_shop_now) ?? false,
      is_shop_collection: parseBool(is_shop_collection) ?? false,
      sort_order: sort_order !== undefined ? Number(sort_order) || 0 : 0,
    });

    const createdVariants = [];
    let parsedVariants = variants;
    if (typeof variants === 'string') {
      try {
        parsedVariants = JSON.parse(variants);
      } catch {
        parsedVariants = [];
      }
    }

    if (Array.isArray(parsedVariants) && parsedVariants.length > 0) {
      for (const v of parsedVariants) {
        const variant = await createVariant({
          product_id: product.id,
          sku: v.sku,
          size: v.size,
          color: v.color,
          color_name: v.color_name,
          price: v.price,
          stock_quantity: v.stock_quantity ?? 0,
        });
        createdVariants.push(variant);
      }
    }

    return sendSuccess(
      res,
      { ...product, variants: createdVariants },
      'Product created successfully',
      201
    );
  } catch (error) {
    return sendServerError(res, 'Failed to create product', error);
  }
}

// PATCH /api/admin/products/:id
export async function updateProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const productId = parseInt(id, 10);
    const { name, base_price, discount_price, category_id, is_active, variants,
            is_new_arrival, is_shop_now, is_shop_collection, sort_order } = req.body;

    const existing = await findProductById(productId);
    if (!existing) {
      return sendNotFound(res, 'Product not found');
    }

    if (req.body.description !== undefined && typeof req.body.description !== 'string') {
      return sendValidationError(res, 'description must be text');
    }
    if (typeof req.body.description === 'string' && req.body.description.length > MAX_DESCRIPTION_LENGTH) {
      return sendValidationError(res, 'description is too long');
    }
    const description =
      typeof req.body.description === 'string' ? sanitizeDescription(req.body.description) : undefined;

    const slug = name ? slugify(name) : undefined;

    const parsedDiscount = parseDiscountPrice(discount_price);
    const effectiveBasePrice = base_price !== undefined ? Number(base_price) : Number(existing.base_price);
    if (parsedDiscount !== null && parsedDiscount !== undefined && parsedDiscount >= effectiveBasePrice) {
      return sendValidationError(res, 'Discount price must be lower than base price');
    }

    const specifications = parseSpecifications(req.body.specifications);
    const highlights = parseHighlights(req.body.highlights);
    if (specifications === 'invalid') {
      return sendValidationError(res, 'specifications must be a list of { label, value } (max 20)');
    }
    if (highlights === 'invalid') {
      return sendValidationError(res, 'highlights must be a list of text lines (max 12)');
    }

    const images = await resolveImages(req);

    const updated = await updateProductModel(productId, {
      name,
      slug,
      description,
      base_price,
      discount_price: parsedDiscount,
      category_id,
      images,
      specifications,
      highlights,
      is_active: parseBool(is_active),
      is_new_arrival: parseBool(is_new_arrival),
      is_shop_now: parseBool(is_shop_now),
      is_shop_collection: parseBool(is_shop_collection),
      sort_order: sort_order !== undefined ? Number(sort_order) || 0 : undefined,
    });

    let parsedVariants = variants;
    if (typeof variants === 'string') {
      try {
        parsedVariants = JSON.parse(variants);
      } catch {
        parsedVariants = undefined;
      }
    }

    if (Array.isArray(parsedVariants)) {
      await deleteVariantsByProductId(productId);
      for (const v of parsedVariants) {
        await createVariant({
          product_id: productId,
          sku: v.sku,
          size: v.size,
          color: v.color,
          color_name: v.color_name,
          price: v.price,
          stock_quantity: v.stock_quantity ?? 0,
        });
      }
    }

    const result = await findProductById(productId);
    return sendSuccess(res, result, 'Product updated successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to update product', error);
  }
}

// PATCH /api/admin/products/reorder
export async function reorderProducts(req: Request, res: Response) {
  try {
    const { orders } = req.body;
    if (!Array.isArray(orders)) {
      return sendValidationError(res, 'orders must be an array of { id, sort_order }');
    }
    for (const item of orders) {
      if (typeof item.id !== 'number' || typeof item.sort_order !== 'number') {
        return sendValidationError(res, 'Each order entry must have numeric id and sort_order');
      }
      await updateProductSortOrder(item.id, item.sort_order);
    }
    return sendSuccess(res, null, 'Products reordered successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to reorder products', error);
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const productId = parseInt(id, 10);

    const existing = await findProductById(productId);
    if (!existing) {
      return sendNotFound(res, 'Product not found');
    }

    await deleteProductModel(productId);
    return sendSuccess(res, null, 'Product deleted successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to delete product', error);
  }
}

export default {
  listProductsPublic,
  getProductBySlug,
  listProductsAdmin,
  getProductById,
  createProduct,
  updateProduct,
  reorderProducts,
  deleteProduct,
};
