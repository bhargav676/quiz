import { Router } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import instructorRoutes from './instructor.routes';
import participantRoutes from './participant.routes';

const router = Router();

// Welcome message
router.get('/', (_req, res) => {
  ApiResponse.success(res, 'Welcome to the QuizArena API', {
    name: 'QuizArena API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    health: '/api/health',
  });
});

// Health check
router.get('/health', (_req, res) => {
  ApiResponse.success(res, 'QuizArena API is running', {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Auth routes
router.use('/auth', authRoutes);

// Admin routes
router.use('/admin', adminRoutes);

// Instructor routes
router.use('/instructor', instructorRoutes);

// Participant routes
router.use('/participant', participantRoutes);

// ==========================================
// Route registrations will be added here
// as we build each feature module
// ==========================================

// Auth routes    → POST /api/auth/*
// User routes    → GET/PATCH /api/users/*
// Quiz routes    → CRUD /api/quizzes/*
// Question routes → CRUD /api/questions/*
// Attempt routes → POST/GET /api/attempts/*
// Result routes  → GET /api/results/*

export default router;
