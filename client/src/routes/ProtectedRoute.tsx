import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAppSelector } from '../store';
import { Role } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated || !user) {
    // Redirect to login page and store current location to redirect back
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If authenticated but role is not allowed, redirect to forbidden/unauthorized page
    return <Navigate to="/forbidden" replace />;
  }

  // Render children routes
  return <Outlet />;
};

export const PublicRoute: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  if (isAuthenticated && user) {
    // Redirect to dashboard if already authenticated
    if (user.role === Role.ADMIN) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === Role.INSTRUCTOR) {
      return <Navigate to="/instructor/dashboard" replace />;
    }
    if (user.role === Role.PARTICIPANT) {
      return <Navigate to="/participant/dashboard" replace />;
    }
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
};
