import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';
import { Role } from '../types';

// Lazy load pages to optimize performance
import Login from '../pages/Login';
import AdminDashboard from '../pages/AdminDashboard';
import QuizForm from '../pages/QuizForm';
import QuizResults from '../pages/QuizResults';
import AccessManagement from '../pages/AccessManagement';
import InstructorDashboard from '../pages/InstructorDashboard';
import InstructorQuizEditor from '../pages/InstructorQuizEditor';
import InstructorAnalytics from '../pages/InstructorAnalytics';
import MainLayout from '../layouts/MainLayout';
import { useAppSelector } from '../store';
import {
  Register,
  ParticipantDashboard,
  TestScreen,
  PostSubmit,
  MyResult,
  DetailedResult,
} from '../pages';

const RoleRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

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
};

const Forbidden: React.FC = () => (
  <div style={{ padding: '2rem', textAlign: 'center', marginTop: '10%' }}>
    <h1 style={{ fontSize: '3rem', color: 'var(--color-error)' }}>403 - Forbidden</h1>
    <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>
      You do not have permission to access this page.
    </p>
    <button
      onClick={() => window.history.back()}
      style={{
        marginTop: '2rem',
        padding: '0.5rem 1.5rem',
        background: 'var(--color-primary)',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
      }}
    >
      Go Back
    </button>
  </div>
);

const NotFound: React.FC = () => (
  <div style={{ padding: '2rem', textAlign: 'center', marginTop: '10%' }}>
    <h1 style={{ fontSize: '3rem', color: 'var(--color-primary)' }}>404 - Page Not Found</h1>
    <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>
      The page you are looking for does not exist.
    </p>
    <a
      href="/"
      style={{
        display: 'inline-block',
        marginTop: '2rem',
        padding: '0.5rem 1.5rem',
        background: 'var(--color-primary)',
        color: '#fff',
        textDecoration: 'none',
        borderRadius: '4px',
      }}
    >
      Go Home
    </a>
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route path="/forbidden" element={<Forbidden />} />

      {/* Admin Panel Routes */}
      <Route element={<ProtectedRoute allowedRoles={[Role.ADMIN]} />}>
        <Route element={<MainLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/quizzes/create" element={<QuizForm />} />
          <Route path="/admin/quizzes/:id/edit" element={<QuizForm />} />
          <Route path="/admin/quizzes/:id/results" element={<QuizResults />} />
          <Route path="/admin/access" element={<AccessManagement />} />
        </Route>
      </Route>

      {/* Instructor Panel Routes */}
      <Route element={<ProtectedRoute allowedRoles={[Role.INSTRUCTOR]} />}>
        <Route element={<MainLayout />}>
          <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
          <Route path="/instructor/quizzes/:id/edit" element={<InstructorQuizEditor />} />
          <Route path="/instructor/quizzes/:id/analytics" element={<InstructorAnalytics />} />
        </Route>
      </Route>

      {/* Participant Panel Routes */}
      <Route element={<ProtectedRoute allowedRoles={[Role.PARTICIPANT]} />}>
        <Route element={<MainLayout />}>
          <Route path="/participant/dashboard" element={<ParticipantDashboard />} />
          <Route path="/participant/attempts/:id/result" element={<MyResult />} />
          <Route path="/participant/attempts/:id/details" element={<DetailedResult />} />
          <Route path="/participant/attempts/:id/submitted" element={<PostSubmit />} />
        </Route>
        {/* Focused view for assessment */}
        <Route path="/participant/quiz/:id/attempt" element={<TestScreen />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<RoleRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
