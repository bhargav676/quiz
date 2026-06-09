import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../store';
import { authService } from '../services';
import type { LoginPayload, RegisterPayload } from '../types';

export function useAuth() {
  const { user, isAuthenticated, isLoading, setAuth, setUser, setLoading, logout } =
    useAuthStore();

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await authService.getMe();
        if (data.data) {
          setUser(data.data);
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(
    async (payload: LoginPayload) => {
      const { data } = await authService.login(payload);
      if (data.data) {
        setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      }
      return data;
    },
    [setAuth]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const { data } = await authService.register(payload);
      if (data.data) {
        setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      }
      return data;
    },
    [setAuth]
  );

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Logout locally even if API call fails
    } finally {
      logout();
    }
  }, [logout]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout: handleLogout,
  };
}
