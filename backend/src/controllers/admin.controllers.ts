import { Request, Response } from 'express';
import { findUserByEmail, createUser, findAllAdmins, updateUserActiveStatus } from '../models/User.js';
import { hashPassword, validateEmail } from '../utils/helpers.js';
import {
  sendSuccess,
  sendValidationError,
  sendServerError,
  sendNotFound,
} from '../utils/response.js';

// GET /api/admin/users
export async function listAdmins(req: Request, res: Response) {
  try {
    const admins = await findAllAdmins();
    return sendSuccess(res, admins, 'Admins fetched successfully');
  } catch (error) {
    return sendServerError(res, 'Failed to fetch admins', error);
  }
}

// POST /api/admin/users
export async function createAdmin(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return sendValidationError(res, 'Name, email and password are required');
    }
    if (!validateEmail(email)) {
      return sendValidationError(res, 'Invalid email format');
    }
    if (password.length < 8) {
      return sendValidationError(res, 'Password must be at least 8 characters');
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return sendValidationError(res, 'An account with this email already exists');
    }

    const passwordHash = await hashPassword(password);
    const admin = await createUser({ name, email, password_hash: passwordHash, role: 'admin' });

    return sendSuccess(
      res,
      { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
      'Admin created successfully',
      201
    );
  } catch (error) {
    return sendServerError(res, 'Failed to create admin', error);
  }
}

// PATCH /api/admin/users/:id
export async function toggleAdminStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return sendValidationError(res, 'is_active must be true or false');
    }

    // Prevent an admin from disabling their own account
    if (req.user && req.user.id === parseInt(id, 10) && is_active === false) {
      return sendValidationError(res, 'You cannot disable your own account');
    }

    const updated = await updateUserActiveStatus(parseInt(id, 10), is_active);
    if (!updated) {
      return sendNotFound(res, 'Admin not found');
    }

    return sendSuccess(res, updated, 'Admin status updated');
  } catch (error) {
    return sendServerError(res, 'Failed to update admin status', error);
  }
}

export default { listAdmins, createAdmin, toggleAdminStatus };