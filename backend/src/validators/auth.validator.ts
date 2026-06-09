import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';

export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    ApiResponse.badRequest(res, 'Name must be at least 2 characters long');
    return;
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
    ApiResponse.badRequest(res, 'Please provide a valid email address');
    return;
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    ApiResponse.badRequest(res, 'Password must be at least 6 characters long');
    return;
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body;

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
    ApiResponse.badRequest(res, 'Please provide a valid email address');
    return;
  }

  if (!password || typeof password !== 'string' || !password) {
    ApiResponse.badRequest(res, 'Password is required');
    return;
  }

  next();
};
