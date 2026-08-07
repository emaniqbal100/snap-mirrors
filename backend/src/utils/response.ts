import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

// Success response
export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(response);
}

// Error response
export function sendError(
  res: Response,
  error: string,
  message: string = 'Error',
  statusCode: number = 400
): Response {
  const response: ApiResponse = {
    success: false,
    statusCode,
    message,
    error,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(response);
}

// Not found response
export function sendNotFound(
  res: Response,
  message: string = 'Resource not found'
): Response {
  return sendError(res, 'NOT_FOUND', message, 404);
}

// Unauthorized response
export function sendUnauthorized(
  res: Response,
  message: string = 'Unauthorized'
): Response {
  return sendError(res, 'UNAUTHORIZED', message, 401);
}

// Forbidden response
export function sendForbidden(
  res: Response,
  message: string = 'Forbidden'
): Response {
  return sendError(res, 'FORBIDDEN', message, 403);
}

// Validation error response
export function sendValidationError(
  res: Response,
  message: string = 'Validation failed',
  errors?: any
): Response {
  const response: any = {
    success: false,
    statusCode: 422,
    message,
    error: 'VALIDATION_ERROR',
    timestamp: new Date().toISOString(),
  };
  if (errors) {
    response.errors = errors;
  }
  return res.status(422).json(response);
}

// Server error response
export function sendServerError(
  res: Response,
  message: string = 'Internal server error',
  error?: any
): Response {
  if (error) {
    console.error('Server Error:', error);
  }
  return sendError(res, 'INTERNAL_SERVER_ERROR', message, 500);
}

export default {
  sendSuccess,
  sendError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendValidationError,
  sendServerError,
};