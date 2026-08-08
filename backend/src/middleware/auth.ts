import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { sendUnauthorized, sendForbidden } from '../utils/response.js';

// Extend Express Request to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
      };
      token?: string;
    }
  }
}

// Verify JWT token
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res, 'Missing authorization token');
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      sendUnauthorized(res, 'Invalid or expired token');
      return;
    }

    // Attach user to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    req.token = token;

    next();
    return;
  } catch (error) {
    sendUnauthorized(res, 'Authentication failed');
    return;
  }
}

// Verify admin role
export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    sendUnauthorized(res, 'User not authenticated');
    return;
  }

  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    sendForbidden(res, 'Admin access required');
    return;
  }

  next();
  return;
}

// Verify superadmin role
export function superadminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    sendUnauthorized(res, 'User not authenticated');
    return;
  }

  if (req.user.role !== 'superadmin') {
    sendForbidden(res, 'Superadmin access required');
    return;
  }

  next();
  return;
}

// Optional auth - doesn't fail if no token
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      if (decoded) {
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
        };
        req.token = token;
      }
    }
    next();
    return;
  } catch (error) {
    next(); // Continue even if auth fails
    return;
  }
}

export default {
  authMiddleware,
  adminMiddleware,
  superadminMiddleware,
  optionalAuthMiddleware,
};