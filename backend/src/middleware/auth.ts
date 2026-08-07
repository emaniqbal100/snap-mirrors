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
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res, 'Missing authorization token')
      return ;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    // Verify token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return sendUnauthorized(res, 'Invalid or expired token');
    }

    // Attach user to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    req.token = token;

    next();
  } catch (error) {
    return sendUnauthorized(res, 'Authentication failed');
  }
}

// Verify admin role
export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    sendUnauthorized(res, 'User not authenticated')
    return ;
  }

  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return sendForbidden(res, 'Admin access required');
  }

  next();
}

// Verify superadmin role
export function superadminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    sendUnauthorized(res, 'User not authenticated')
    return;
  }

  if (req.user.role !== 'superadmin') {
    return sendForbidden(res, 'Superadmin access required');
  }

  next();
}

// Optional auth - doesn't fail if no token
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
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
  } catch (error) {
    next(); // Continue even if auth fails
  }
}

export default {
  authMiddleware,
  adminMiddleware,
  superadminMiddleware,
  optionalAuthMiddleware,
};