import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`❌ Error: ${message}`, {
    statusCode,
    stack: process.env.NODE_ENV === 'development' && statusCode >= 500 ? err.stack : undefined,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    ApiResponse.badRequest(res, 'Validation Error', message);
    return;
  }

  // Mongoose duplicate key error
  if (err.name === 'MongoServerError' && (err as unknown as { code: number }).code === 11000) {
    ApiResponse.conflict(res, 'Duplicate entry found');
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    ApiResponse.unauthorized(res, 'Invalid token');
    return;
  }

  if (err.name === 'TokenExpiredError') {
    ApiResponse.unauthorized(res, 'Token expired');
    return;
  }

  // Default error
  ApiResponse.error(
    res,
    message,
    statusCode,
    process.env.NODE_ENV === 'development' ? err.stack : undefined
  );
};
