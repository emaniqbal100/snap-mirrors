import { query } from '../config/database.js';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: Date;
}

export async function findAllCategories(): Promise<Category[]> {
  const result = await query('SELECT * FROM categories ORDER BY name ASC');
  return result.rows;
}

export async function findCategoryById(id: number): Promise<Category | null> {
  const result = await query('SELECT * FROM categories WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function findCategoryBySlug(slug: string): Promise<Category | null> {
  const result = await query('SELECT * FROM categories WHERE slug = $1', [slug]);
  return result.rows[0] || null;
}

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
}): Promise<Category> {
  const result = await query(
    `INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) RETURNING *`,
    [data.name, data.slug, data.description || null]
  );
  return result.rows[0];
}

export async function updateCategory(
  id: number,
  data: { name?: string; slug?: string; description?: string }
): Promise<Category | null> {
  const result = await query(
    `UPDATE categories
     SET name = COALESCE($1, name),
         slug = COALESCE($2, slug),
         description = COALESCE($3, description)
     WHERE id = $4
     RETURNING *`,
    [data.name || null, data.slug || null, data.description || null, id]
  );
  return result.rows[0] || null;
}

export async function deleteCategory(id: number): Promise<boolean> {
  const result = await query('DELETE FROM categories WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export default {
  findAllCategories,
  findCategoryById,
  findCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};