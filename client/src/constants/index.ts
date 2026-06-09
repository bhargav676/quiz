import { Role, QuizStatus, AttemptStatus } from '../types';

// ==========================================
// API Endpoints
// ==========================================
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  // Users
  USERS: {
    LIST: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    UPDATE_ROLE: (id: string) => `/users/${id}/role`,
  },
  // Quizzes
  QUIZZES: {
    LIST: '/quizzes',
    BY_ID: (id: string) => `/quizzes/${id}`,
    SCHEDULE: (id: string) => `/quizzes/${id}/schedule`,
    PUBLISH: (id: string) => `/quizzes/${id}/publish`,
    CANCEL: (id: string) => `/quizzes/${id}/cancel`,
  },
  // Questions
  QUESTIONS: {
    BY_QUIZ: (quizId: string) => `/quizzes/${quizId}/questions`,
    BY_ID: (id: string) => `/questions/${id}`,
    CSV_UPLOAD: (quizId: string) => `/quizzes/${quizId}/questions/csv`,
  },
  // Participants
  PARTICIPANTS: {
    BY_QUIZ: (quizId: string) => `/quizzes/${quizId}/participants`,
    REMOVE: (quizId: string, participantId: string) =>
      `/quizzes/${quizId}/participants/${participantId}`,
    CSV_UPLOAD: (quizId: string) => `/quizzes/${quizId}/participants/csv`,
  },
  // Attempts
  ATTEMPTS: {
    START: '/attempts/start',
    SAVE_ANSWER: '/attempts/save-answer',
    SUBMIT: '/attempts/submit',
    BY_ID: (id: string) => `/attempts/${id}`,
  },
  // Results
  RESULTS: {
    BY_QUIZ: (quizId: string) => `/results/${quizId}`,
    BY_USER: (userId: string) => `/results/user/${userId}`,
    DETAILS: (attemptId: string) => `/results/details/${attemptId}`,
  },
} as const;

// ==========================================
// Route Paths
// ==========================================
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  NOT_FOUND: '/404',
  // Admin
  ADMIN: {
    CREATE_QUIZ: '/admin/quizzes/create',
    EDIT_QUIZ: (id = ':id') => `/admin/quizzes/${id}/edit`,
    RESULTS: '/admin/results',
    USERS: '/admin/users',
    ANALYTICS: '/admin/analytics',
  },
  // Instructor
  INSTRUCTOR: {
    QUIZZES: '/instructor/quizzes',
    QUIZ_BUILDER: (id = ':id') => `/instructor/quizzes/${id}/builder`,
    PARTICIPANTS: (id = ':id') => `/instructor/quizzes/${id}/participants`,
    RESULTS: '/instructor/results',
    ANALYTICS: '/instructor/analytics',
  },
  // Participant
  PARTICIPANT: {
    UPCOMING: '/participant/upcoming',
    LIVE: '/participant/live',
    ATTEMPT: (id = ':id') => `/participant/quiz/${id}/attempt`,
    RESULTS: '/participant/results',
    RESULT_DETAIL: (id = ':id') => `/participant/results/${id}`,
    HISTORY: '/participant/history',
  },
} as const;

// ==========================================
// Role Labels
// ==========================================
export const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]: 'Admin',
  [Role.INSTRUCTOR]: 'Instructor',
  [Role.PARTICIPANT]: 'Participant',
};

// ==========================================
// Quiz Status Labels & Colors
// ==========================================
export const QUIZ_STATUS_CONFIG: Record<
  QuizStatus,
  { label: string; color: string; bgColor: string }
> = {
  [QuizStatus.DRAFT]: { label: 'Draft', color: '#64748b', bgColor: '#f1f5f9' },
  [QuizStatus.SCHEDULED]: { label: 'Scheduled', color: '#2563eb', bgColor: '#eff6ff' },
  [QuizStatus.LIVE]: { label: 'Live', color: '#16a34a', bgColor: '#f0fdf4' },
  [QuizStatus.COMPLETED]: { label: 'Completed', color: '#7e22ce', bgColor: '#faf5ff' },
  [QuizStatus.EXPIRED]: { label: 'Expired', color: '#d97706', bgColor: '#fffbeb' },
  [QuizStatus.CANCELLED]: { label: 'Cancelled', color: '#dc2626', bgColor: '#fef2f2' },
};

// ==========================================
// Attempt Status Labels
// ==========================================
export const ATTEMPT_STATUS_LABELS: Record<AttemptStatus, string> = {
  [AttemptStatus.IN_PROGRESS]: 'In Progress',
  [AttemptStatus.SUBMITTED]: 'Submitted',
  [AttemptStatus.AUTO_SUBMITTED]: 'Auto Submitted',
};

// ==========================================
// Pagination
// ==========================================
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// ==========================================
// Storage Keys
// ==========================================
export const STORAGE_KEYS = {
  THEME: 'quizarena_theme',
  ACCESS_TOKEN: 'quizarena_access_token',
  REFRESH_TOKEN: 'quizarena_refresh_token',
} as const;
