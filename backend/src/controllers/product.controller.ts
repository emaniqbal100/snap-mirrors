import { Request, Response } from 'express';
import {
  findAllProducts,
  findProductById,
  findProductBySlug,
  createProduct as createProductModel,
  updateProduct as updateProductModel,
  deleteProduct as deleteProductModel,
  createVariant,
  updateVariant as updateVariantModel,
  deleteVariant as deleteVariantModel,
  deleteVariantsByProductId,
} from '../models/Product.js';
import { slugify } from '../utils/helpers.js';
import {
  sendSuccess,
  sendValidationError,
  sendNotFound,
  sendServerError,
} from '../utils/response.js';

// GET /api/products (public - only active products)
export async function listProductsPublic(req: Request, res: Response) {
  try {
    const products = await findAllProducts(true);
    return sendSuccess(res, products, 'Products fetched successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to fetch products', error);
  }
}

// GET /api/products/:slug (public)
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

// GET /api/admin/products (admin - all products including inactive)
export async function listProductsAdmin(req: Request, res: Response) {
  try {
    const products = await findAllProducts(false);
    return sendSuccess(res, products, 'Products fetched successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to fetch products', error);
  }
}

// GET /api/admin/products/:id (admin)
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

// POST /api/admin/products
// body: { name, description, base_price, category_id, images, variants: [{size, color, sku, price, stock_quantity}] }
export async function createProduct(req: Request, res: Response) {
  try {
    const { name, description, base_price, category_id, images, variants } = req.body;

    if (!name || base_price === undefined) {
      return sendValidationError(res, 'Name and base_price are required');
    }

    const slug = slugify(name);

    const product = await createProductModel({
      name,
      slug,
      description,
      base_price,
      category_id,
      images,
    });

    const createdVariants = [];
    if (Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
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
// body: { name?, description?, base_price?, category_id?, images?, is_active?, variants?: [{id?, size, color, sku, price, stock_quantity}] }
export async function updateProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const productId = parseInt(id, 10);
    const { name, description, base_price, category_id, images, is_active, variants } = req.body;

    const existing = await findProductById(productId);
    if (!existing) {
      return sendNotFound(res, 'Product not found');
    }

    const slug = name ? slugify(name) : undefined;

    const updated = await updateProductModel(productId, {
      name,
      slug,
      description,
      base_price,
      category_id,
      images,
      is_active,
    });

    // If variants array provided, replace all variants
    if (Array.isArray(variants)) {
      await deleteVariantsByProductId(productId);
      for (const v of variants) {
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

// DELETE /api/admin/products/:id
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