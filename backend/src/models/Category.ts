import { query } from '../config/database.js';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  sort_order: number;
  created_at: Date;
  parent_name?: string | null;
  parent_slug?: string | null;
}

export interface CategoryNode extends Category {
  children: Category[];
}

const SELECT_WITH_PARENT = `
  SELECT c.*, p.name AS parent_name, p.slug AS parent_slug
  FROM categories c
  LEFT JOIN categories p ON c.parent_id = p.id
`;

// Flat list (main categories and sub-categories together, each with parent info).
export async function findAllCategories(): Promise<Category[]> {
  const result = await query(
    `${SELECT_WITH_PARENT} ORDER BY COALESCE(p.sort_order, c.sort_order), COALESCE(p.id, c.id), c.parent_id NULLS FIRST, c.sort_order ASC, c.name ASC`
  );
  return result.rows;
}

// Nested list: main categories, each with its sub-categories in `children`.
export async function findCategoryTree(): Promise<CategoryNode[]> {
  const all = await findAllCategories();
  const mains = all.filter((c) => c.parent_id === null);
  return mains.map((m) => ({
    ...m,
    children: all.filter((c) => c.parent_id === m.id),
  }));
}

export async function findCategoryById(id: number): Promise<Category | null> {
  const result = await query(`${SELECT_WITH_PARENT} WHERE c.id = $1`, [id]);
  return result.rows[0] || null;
}

export async function findCategoryBySlug(slug: string): Promise<Category | null> {
  const result = await query(`${SELECT_WITH_PARENT} WHERE c.slug = $1`, [slug]);
  return result.rows[0] || null;
}

export async function findChildCategories(parentId: number): Promise<Category[]> {
  const result = await query(
    `${SELECT_WITH_PARENT} WHERE c.parent_id = $1 ORDER BY c.sort_order ASC, c.name ASC`,
    [parentId]
  );
  return result.rows;
}

// The category's own id plus the ids of all its sub-categories
// (used so that filtering by a main category also returns its sub-category products).
export async function getCategoryAndDescendantIds(id: number): Promise<number[]> {
  const result = await query(
    'SELECT id FROM categories WHERE id = $1 OR parent_id = $1',
    [id]
  );
  return result.rows.map((r: { id: number }) => r.id);
}

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
  parent_id?: number | null;
  sort_order?: number;
}): Promise<Category> {
  const result = await query(
    `INSERT INTO categories (name, slug, description, parent_id, sort_order)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.name, data.slug, data.description || null, data.parent_id ?? null, data.sort_order ?? 0]
  );
  return result.rows[0];
}

// `parent_id` and `sort_order` are only changed when they are present in `data`;
// parent_id: null explicitly turns a sub-category back into a main category.
export async function updateCategory(
  id: number,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    parent_id?: number | null;
    sort_order?: number;
  }
): Promise<Category | null> {
  const changeParent = data.parent_id !== undefined;
  const result = await query(
    `UPDATE categories
     SET name = COALESCE($1, name),
         slug = COALESCE($2, slug),
         description = COALESCE($3, description),
         parent_id = CASE WHEN $4 THEN $5::int ELSE parent_id END,
         sort_order = COALESCE($6, sort_order)
     WHERE id = $7
     RETURNING *`,
    [
      data.name || null,
      data.slug || null,
      data.description || null,
      changeParent,
      changeParent ? data.parent_id : null,
      data.sort_order ?? null,
      id,
    ]
  );
  return result.rows[0] || null;
}

export async function deleteCategory(id: number): Promise<boolean> {
  const result = await query('DELETE FROM categories WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export default {
  findAllCategories,
  findCategoryTree,
  findCategoryById,
  findCategoryBySlug,
  findChildCategories,
  getCategoryAndDescendantIds,
  createCategory,
  updateCategory,
  deleteCategory,
};
