import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { Role } from '../types/enums';
import { ApiResponse } from '../utils/apiResponse';
import { verifyAccessToken } from '../utils/token';

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ApiResponse.unauthorized(res, 'Authentication token required');
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };
    next();
  } catch (error) {
    ApiResponse.unauthorized(res, 'Invalid or expired access token');
    return;
  }
};

export const roleMiddleware = (allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiResponse.unauthorized(res, 'Authentication required');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      ApiResponse.forbidden(res, 'Access denied: insufficient permissions');
      return;
    }

    next();
  };
};
