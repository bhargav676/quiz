import { Response } from 'express';
import { ApiResponseData } from '../types';

export class ApiResponse {
  static success<T>(res: Response, message: string, data?: T, statusCode = 200): Response {
    const response: ApiResponseData<T> = {
      success: true,
      message,
      data,
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, message: string, data?: T): Response {
    return ApiResponse.success(res, message, data, 201);
  }

  static error(res: Response, message: string, statusCode = 500, error?: string): Response {
    const response: ApiResponseData = {
      success: false,
      message,
      error,
    };
    return res.status(statusCode).json(response);
  }

  static badRequest(res: Response, message: string, error?: string): Response {
    return ApiResponse.error(res, message, 400, error);
  }

  static unauthorized(res: Response, message = 'Unauthorized'): Response {
    return ApiResponse.error(res, message, 401);
  }

  static forbidden(res: Response, message = 'Forbidden'): Response {
    return ApiResponse.error(res, message, 403);
  }

  static notFound(res: Response, message = 'Resource not found'): Response {
    return ApiResponse.error(res, message, 404);
  }

  static conflict(res: Response, message: string): Response {
    return ApiResponse.error(res, message, 409);
  }
}
