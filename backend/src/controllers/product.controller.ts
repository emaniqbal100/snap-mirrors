import { Request, Response } from 'express';
import { config } from '../config/env.js';
import { uploadBufferToCloudinary } from '../config/cloudinary.js';
import {
  findAllProducts,
  findProductById,
  findProductBySlug,
  createProduct as createProductModel,
  updateProduct as updateProductModel,
  deleteProduct as deleteProductModel,
  createVariant,
  deleteVariantsByProductId,
} from '../models/Product.js';
import { slugify } from '../utils/helpers.js';
import {
  sendSuccess,
  sendValidationError,
  sendNotFound,
  sendServerError,
} from '../utils/response.js';

// ============================================
// PUBLIC
// ============================================

export async function listProductsPublic(req: Request, res: Response) {
  try {
    const products = await findAllProducts(true);
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

// NEW: combine any image URLs the admin typed manually (sent as a JSON string
// in the "images" field) with any newly uploaded files (sent as multipart
// files under the "newImages" field, up to 6 — see uploadMultipleImages).
async function resolveImages(req: Request): Promise<string[] | undefined> {
  let urlImages: string[] = [];

  if (typeof req.body.images === 'string' && req.body.images.trim() !== '') {
    try {
      const parsed = JSON.parse(req.body.images);
      if (Array.isArray(parsed)) urlImages = parsed.filter((u) => typeof u === 'string' && u.trim());
    } catch {
      // ignore malformed JSON — treat as no URL images
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

  // undefined means "don't touch existing images" (relevant for updates when
  // the admin didn't change anything about the images section at all).
  if (combined.length === 0 && urlImages.length === 0 && uploadedUrls.length === 0 && req.body.images === undefined) {
    return undefined;
  }
  return combined;
}

// POST /api/admin/products
// body: { name, description, base_price, discount_price, category_id, images (JSON string of URLs), variants }
// files: newImages (multipart/form-data, up to 6, optional)
export async function createProduct(req: Request, res: Response) {
  try {
    const { name, description, base_price, discount_price, category_id, variants } = req.body;

    if (!name || base_price === undefined) {
      return sendValidationError(res, 'Name and base_price are required');
    }

    const parsedDiscount = parseDiscountPrice(discount_price);
    if (parsedDiscount !== null && parsedDiscount !== undefined && parsedDiscount >= Number(base_price)) {
      return sendValidationError(res, 'Discount price must be lower than base price');
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
    const { name, description, base_price, discount_price, category_id, is_active, variants } = req.body;

    const existing = await findProductById(productId);
    if (!existing) {
      return sendNotFound(res, 'Product not found');
    }

    const slug = name ? slugify(name) : undefined;

    const parsedDiscount = parseDiscountPrice(discount_price);
    const effectiveBasePrice = base_price !== undefined ? Number(base_price) : Number(existing.base_price);
    if (parsedDiscount !== null && parsedDiscount !== undefined && parsedDiscount >= effectiveBasePrice) {
      return sendValidationError(res, 'Discount price must be lower than base price');
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
      is_active,
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
  deleteProduct,
};
