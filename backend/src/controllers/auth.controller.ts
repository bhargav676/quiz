import { Request, Response } from 'express';
import { User } from '../models/User';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token';
import { Role } from '../types/enums';

// Helper to set refresh token cookie
const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days matching JWT_REFRESH_EXPIRES_IN
  });
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return ApiResponse.conflict(res, 'A user with this email already exists');
  }

  // Determine role — only allow creating Participant or Instructor. Admin must be seeded or assigned.
  const userRole = role && Object.values(Role).includes(role) && role !== Role.ADMIN 
    ? role 
    : Role.PARTICIPANT;

  // Create user (password hashed in pre-save hook)
  const user = new User({
    name,
    email,
    password,
    role: userRole,
    isActive: true,
  });

  await user.save();

  // Generate tokens
  const payload = { id: user._id.toString(), role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  setRefreshTokenCookie(res, refreshToken);

  return ApiResponse.created(res, 'User registered successfully', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Find user and explicitly select password field
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive) {
    return ApiResponse.unauthorized(res, 'Invalid email or password');
  }

  // Compare passwords
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return ApiResponse.unauthorized(res, 'Invalid email or password');
  }

  // Generate tokens
  const payload = { id: user._id.toString(), role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  setRefreshTokenCookie(res, refreshToken);

  return ApiResponse.success(res, 'Logged in successfully', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken,
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  // Try to read refresh token from HTTP-only cookie or request body
  const token = req.cookies?.refreshToken || req.body.refreshToken;

  if (!token) {
    return ApiResponse.unauthorized(res, 'Refresh token not found');
  }

  try {
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return ApiResponse.unauthorized(res, 'User not found or inactive');
    }

    // Generate fresh tokens
    const payload = { id: user._id.toString(), role: user.role };
    const accessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    setRefreshTokenCookie(res, newRefreshToken);

    return ApiResponse.success(res, 'Token refreshed successfully', {
      accessToken,
      refreshToken: newRefreshToken, // also return it in body just in case client needs it
    });
  } catch (error) {
    return ApiResponse.unauthorized(res, 'Invalid or expired refresh token');
  }
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  return ApiResponse.success(res, 'Logged out successfully');
});
