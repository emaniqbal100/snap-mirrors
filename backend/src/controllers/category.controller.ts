import { Request, Response } from 'express';
import {
  findAllCategories,
  findCategoryById,
  findCategoryBySlug,
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

// GET /api/categories (public)
export async function listCategories(req: Request, res: Response) {
  try {
    const categories = await findAllCategories();
    return sendSuccess(res, categories, 'Categories fetched successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to fetch categories', error);
  }
}

// POST /api/admin/categories
export async function createCategory(req: Request, res: Response) {
  try {
    const { name, description } = req.body;

    if (!name) {
      return sendValidationError(res, 'Category name is required');
    }

    const slug = slugify(name);

    const existing = await findCategoryBySlug(slug);
    if (existing) {
      return sendValidationError(res, 'A category with this name already exists');
    }

    const category = await createCategoryModel({ name, slug, description });
    return sendSuccess(res, category, 'Category created successfully', 201);
  } catch (error) {
    return sendServerError(res, 'Failed to create category', error);
  }
}

// PATCH /api/admin/categories/:id
export async function updateCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const existing = await findCategoryById(parseInt(id, 10));
    if (!existing) {
      return sendNotFound(res, 'Category not found');
    }

    const slug = name ? slugify(name) : undefined;

    const updated = await updateCategoryModel(parseInt(id, 10), { name, slug, description });
    return sendSuccess(res, updated, 'Category updated successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to update category', error);
  }
}

// DELETE /api/admin/categories/:id
export async function deleteCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existing = await findCategoryById(parseInt(id, 10));
    if (!existing) {
      return sendNotFound(res, 'Category not found');
    }

    await deleteCategoryModel(parseInt(id, 10));
    return sendSuccess(res, null, 'Category deleted successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to delete category', error);
  }
}

export default { listCategories, createCategory, updateCategory, deleteCategory };