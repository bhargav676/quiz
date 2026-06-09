import api from './api';
import { API_ENDPOINTS } from '../constants';
import type { LoginPayload, RegisterPayload, AuthResponse, User, ApiResponse } from '../types';

export const authService = {
  register: (payload: RegisterPayload) =>
    api.post<ApiResponse<AuthResponse>>(API_ENDPOINTS.AUTH.REGISTER, payload),

  login: (payload: LoginPayload) =>
    api.post<ApiResponse<AuthResponse>>(API_ENDPOINTS.AUTH.LOGIN, payload),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refreshToken }
    ),

  logout: () =>
    api.post<ApiResponse>(API_ENDPOINTS.AUTH.LOGOUT),

  getMe: () =>
    api.get<ApiResponse<User>>(API_ENDPOINTS.AUTH.ME),
};
