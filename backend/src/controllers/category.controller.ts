import { Request, Response } from 'express';
import {
  findAllCategories,
  findCategoryTree,
  findCategoryById,
  findCategoryBySlug,
  findChildCategories,
  createCategory as createCategoryModel,
  updateCategory as updateCategoryModel,
  deleteCategory as deleteCategoryModel,
} from '../models/Category.js';
import { slugify } from '../utils/helpers.js';
import {
  sendSuccess,
  sendValidationError,
  sendNotFound,
  sendServerError,
} from '../utils/response.js';

// Turns a request value into: undefined (not sent), null (explicitly "no parent"), or a number.
// Returns 'invalid' for anything else.
function parseParentId(value: unknown): number | null | undefined | 'invalid' {
  if (value === undefined) return undefined;
  if (value === null || value === '' || value === 'null') return null;
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : 'invalid';
}

function parseSortOrder(value: unknown): number | undefined | 'invalid' {
  if (value === undefined || value === '') return undefined;
  const num = Number(value);
  return Number.isInteger(num) ? num : 'invalid';
}

// GET /api/categories (public)
//   (no query)      -> flat list of every category, each with parent_id / parent_name / parent_slug
//   ?tree=true      -> main categories with their sub-categories nested in `children`
export async function listCategories(req: Request, res: Response) {
  try {
    const categories =
      req.query.tree === 'true' ? await findCategoryTree() : await findAllCategories();
    return sendSuccess(res, categories, 'Categories fetched successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to fetch categories', error);
  }
}

// GET /api/categories/:slug (public) - one category with its parent and sub-categories
export async function getCategoryBySlug(req: Request, res: Response) {
  try {
    const category = await findCategoryBySlug(req.params.slug);
    if (!category) {
      return sendNotFound(res, 'Category not found');
    }
    const children = await findChildCategories(category.id);
    return sendSuccess(res, { ...category, children }, 'Category fetched successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to fetch category', error);
  }
}

// POST /api/admin/categories
// body: { name, description?, parent_id?, sort_order? }
export async function createCategory(req: Request, res: Response) {
  try {
    const { name, description } = req.body;

    if (!name) {
      return sendValidationError(res, 'Category name is required');
    }

    const parentId = parseParentId(req.body.parent_id);
    const sortOrder = parseSortOrder(req.body.sort_order);
    if (parentId === 'invalid') return sendValidationError(res, 'parent_id must be a valid category id');
    if (sortOrder === 'invalid') return sendValidationError(res, 'sort_order must be a whole number');

    if (parentId) {
      const parent = await findCategoryById(parentId);
      if (!parent) return sendValidationError(res, 'Parent category not found');
      if (parent.parent_id !== null) {
        return sendValidationError(res, 'Sub-categories can only be added under a main category');
      }
    }

    const slug = slugify(name);

    const existing = await findCategoryBySlug(slug);
    if (existing) {
      return sendValidationError(res, 'A category with this name already exists');
    }

    const category = await createCategoryModel({
      name,
      slug,
      description,
      parent_id: parentId ?? null,
      sort_order: sortOrder,
    });
    return sendSuccess(res, category, 'Category created successfully', 201);
  } catch (error) {
    return sendServerError(res, 'Failed to create category', error);
  }
}

// PATCH /api/admin/categories/:id
// body: { name?, description?, parent_id? (null = make it a main category), sort_order? }
export async function updateCategory(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, description } = req.body;

    const existing = await findCategoryById(id);
    if (!existing) {
      return sendNotFound(res, 'Category not found');
    }

    const parentId = parseParentId(req.body.parent_id);
    const sortOrder = parseSortOrder(req.body.sort_order);
    if (parentId === 'invalid') return sendValidationError(res, 'parent_id must be a valid category id');
    if (sortOrder === 'invalid') return sendValidationError(res, 'sort_order must be a whole number');

    if (parentId) {
      if (parentId === id) {
        return sendValidationError(res, 'A category cannot be its own parent');
      }
      const parent = await findCategoryById(parentId);
      if (!parent) return sendValidationError(res, 'Parent category not found');
      if (parent.parent_id !== null) {
        return sendValidationError(res, 'Sub-categories can only be added under a main category');
      }
      const children = await findChildCategories(id);
      if (children.length > 0) {
        return sendValidationError(
          res,
          'This category has sub-categories, so it cannot become a sub-category itself'
        );
      }
    }

    const slug = name ? slugify(name) : undefined;
    if (slug && slug !== existing.slug) {
      const clash = await findCategoryBySlug(slug);
      if (clash && clash.id !== id) {
        return sendValidationError(res, 'A category with this name already exists');
      }
    }

    const updated = await updateCategoryModel(id, {
      name,
      slug,
      description,
      parent_id: parentId,
      sort_order: sortOrder,
    });
    return sendSuccess(res, updated, 'Category updated successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to update category', error);
  }
}

// DELETE /api/admin/categories/:id
export async function deleteCategory(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);

    const existing = await findCategoryById(id);
    if (!existing) {
      return sendNotFound(res, 'Category not found');
    }

    const children = await findChildCategories(id);
    if (children.length > 0) {
      return sendValidationError(
        res,
        'Delete or move this category\'s sub-categories first'
      );
    }

    await deleteCategoryModel(id);
    return sendSuccess(res, null, 'Category deleted successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to delete category', error);
  }
}

export default {
  listCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
