import { Request, Response } from 'express';
import { loginAdmin, refreshAccessToken, logoutAdmin, AuthError } from '../auth.services.js';
import { findUserById } from '../models/User.js';
import { sendSuccess, sendUnauthorized, sendValidationError, sendServerError } from '../utils/response.js';
import { validateEmail } from '../utils/helpers.js';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendValidationError(res, 'Email and password are required');
    }
    if (!validateEmail(email)) {
      return sendValidationError(res, 'Invalid email format');
    }

    const result = await loginAdmin(email, password);
    return sendSuccess(res, result, 'Login successful');
  } catch (error) {
    if (error instanceof AuthError) {
      return sendUnauthorized(res, error.message);
    }
    return sendServerError(res, 'Login failed', error);
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return sendValidationError(res, 'Refresh token is required');
    }

    const tokens = await refreshAccessToken(refreshToken);
    return sendSuccess(res, tokens, 'Token refreshed');
  } catch (error) {
    if (error instanceof AuthError) {
      return sendUnauthorized(res, error.message);
    }
    return sendServerError(res, 'Token refresh failed', error);
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await logoutAdmin(refreshToken);
    }
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    return sendServerError(res, 'Logout failed', error);
  }
}

export async function me(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendUnauthorized(res, 'Not authenticated');
    }
    const user = await findUserById(req.user.id);
    if (!user) {
      return sendUnauthorized(res, 'User not found');
    }
    return sendSuccess(res, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    return sendServerError(res, 'Failed to fetch user', error);
  }
}

export default { login, refresh, logout, me };