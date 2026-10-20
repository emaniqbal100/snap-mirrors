import { query } from '../config/database.js';

export interface Product {
  id: number;
  category_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  discount_price: number | null; // NEW
  images: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string | null;
  size: string | null;
  color: string | null;
  price: number | null;
  stock_quantity: number;
  created_at: Date;
}

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
  category_name?: string;
  category_slug?: string;
  category_parent_id?: number | null;
  parent_category_name?: string | null;
  parent_category_slug?: string | null;
}

// ============ PRODUCTS ============

// category_name / category_slug describe the category the product is filed under (this can be a
// sub-category). When it is a sub-category, parent_category_* describe its main category.
const CATEGORY_COLUMNS = `c.name AS category_name, c.slug AS category_slug,
       c.parent_id AS category_parent_id,
       pc.name AS parent_category_name, pc.slug AS parent_category_slug`;

export async function findAllProducts(
  activeOnly = false,
  categoryIds?: number[]
): Promise<ProductWithVariants[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (activeOnly) conditions.push('p.is_active = true');
  if (categoryIds) {
    params.push(categoryIds);
    conditions.push(`p.category_id = ANY($${params.length}::int[])`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query(
    `SELECT p.*, ${CATEGORY_COLUMNS}
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN categories pc ON c.parent_id = pc.id
     ${whereClause}
     ORDER BY p.created_at DESC`,
    params
  );

  const products = result.rows;
  const productIds = products.map((p: any) => p.id);

  if (productIds.length === 0) return [];

  const variantsResult = await query(
    `SELECT * FROM product_variants WHERE product_id = ANY($1::int[]) ORDER BY id ASC`,
    [productIds]
  );

  const variantsByProduct: Record<number, ProductVariant[]> = {};
  for (const v of variantsResult.rows) {
    if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
    variantsByProduct[v.product_id].push(v);
  }

  return products.map((p: any) => ({
    ...p,
    variants: variantsByProduct[p.id] || [],
  }));
}

export async function findProductById(id: number): Promise<ProductWithVariants | null> {
  const result = await query(
    `SELECT p.*, ${CATEGORY_COLUMNS}
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN categories pc ON c.parent_id = pc.id
     WHERE p.id = $1`,
    [id]
  );
  if (result.rows.length === 0) return null;

  const variantsResult = await query(
    'SELECT * FROM product_variants WHERE product_id = $1 ORDER BY id ASC',
    [id]
  );

  return { ...result.rows[0], variants: variantsResult.rows };
}

export async function findProductBySlug(slug: string): Promise<ProductWithVariants | null> {
  const result = await query(
    `SELECT p.*, ${CATEGORY_COLUMNS}
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN categories pc ON c.parent_id = pc.id
     WHERE p.slug = $1`,
    [slug]
  );
  if (result.rows.length === 0) return null;

  const variantsResult = await query(
    'SELECT * FROM product_variants WHERE product_id = $1 ORDER BY id ASC',
    [result.rows[0].id]
  );

  return { ...result.rows[0], variants: variantsResult.rows };
}

export async function createProduct(data: {
  category_id?: number | null;
  name: string;
  slug: string;
  description?: string;
  base_price: number;
  discount_price?: number | null;
  images?: string[];
}): Promise<Product> {
  const result = await query(
    `INSERT INTO products (category_id, name, slug, description, base_price, discount_price, images)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
     RETURNING *`,
    [
      data.category_id || null,
      data.name,
      data.slug,
      data.description || null,
      data.base_price,
      data.discount_price ?? null,
      JSON.stringify(data.images || []), // Ab ::jsonb ki waja se jsonb ban kar insert hoga
    ]
  );
  return result.rows[0];
}
export async function updateProduct(
  id: number,
  data: {
    category_id?: number | null;
    name?: string;
    slug?: string;
    description?: string;
    base_price?: number;
    discount_price?: number | null;
    images?: string[];
    is_active?: boolean;
  }
): Promise<Product | null> {
  const discountPriceParam = data.discount_price === undefined ? null : data.discount_price;
  const shouldUpdateDiscount = data.discount_price !== undefined;

  const result = await query(
    `UPDATE products
     SET category_id = COALESCE($1, category_id),
         name = COALESCE($2, name),
         slug = COALESCE($3, slug),
         description = COALESCE($4, description),
         base_price = COALESCE($5, base_price),
         discount_price = CASE WHEN $6 THEN $7 ELSE discount_price END,
         images = COALESCE($8::jsonb, images),
         is_active = COALESCE($9, is_active),
         updated_at = NOW()
     WHERE id = $10
     RETURNING *`,
    [
      data.category_id ?? null,
      data.name ?? null,
      data.slug ?? null,
      data.description ?? null,
      data.base_price ?? null,
      shouldUpdateDiscount,
      discountPriceParam,
      data.images ? JSON.stringify(data.images) : null,
      data.is_active ?? null,
      id,
    ]
  );
  return result.rows[0] || null;
}

export async function deleteProduct(id: number): Promise<boolean> {
  const result = await query('DELETE FROM products WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

// ============ VARIANTS ============

export async function createVariant(data: {
  product_id: number;
  sku?: string;
  size?: string;
  color?: string;
  price?: number;
  stock_quantity: number;
}): Promise<ProductVariant> {
  const result = await query(
    `INSERT INTO product_variants (product_id, sku, size, color, price, stock_quantity)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.product_id,
      data.sku || null,
      data.size || null,
      data.color || null,
      data.price || null,
      data.stock_quantity,
    ]
  );
  return result.rows[0];
}

export async function updateVariant(
  id: number,
  data: { sku?: string; size?: string; color?: string; price?: number; stock_quantity?: number }
): Promise<ProductVariant | null> {
  const result = await query(
    `UPDATE product_variants
     SET sku = COALESCE($1, sku),
         size = COALESCE($2, size),
         color = COALESCE($3, color),
         price = COALESCE($4, price),
         stock_quantity = COALESCE($5, stock_quantity)
     WHERE id = $6
     RETURNING *`,
    [
      data.sku ?? null,
      data.size ?? null,
      data.color ?? null,
      data.price ?? null,
      data.stock_quantity ?? null,
      id,
    ]
  );
  return result.rows[0] || null;
}

export async function deleteVariant(id: number): Promise<boolean> {
  const result = await query('DELETE FROM product_variants WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function deleteVariantsByProductId(productId: number): Promise<void> {
  await query('DELETE FROM product_variants WHERE product_id = $1', [productId]);
}

export default {
  findAllProducts,
  findProductById,
  findProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  deleteVariantsByProductId,
};
