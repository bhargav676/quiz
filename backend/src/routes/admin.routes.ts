import { Router } from 'express';
import {
  getDashboardStats,
  getAdminQuizzes,
  getAdminQuizById,
  createQuiz,
  updateQuiz,
  cancelQuiz,
  getQuizResults,
  assignInstructor,
} from '../controllers/admin.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { validateQuiz, validateAssignInstructor } from '../validators/admin.validator';
import { Role } from '../types/enums';

const router = Router();

// Secure all admin routes to logged-in users with ADMIN role
router.use(authMiddleware);
router.use(roleMiddleware([Role.ADMIN]));

router.get('/dashboard', getDashboardStats);
router.get('/quizzes', getAdminQuizzes);
router.get('/quizzes/:id', getAdminQuizById);
router.post('/quizzes', validateQuiz, createQuiz);
router.put('/quizzes/:id', validateQuiz, updateQuiz);
router.patch('/quizzes/:id/cancel', cancelQuiz);
router.get('/quizzes/:id/results', getQuizResults);
router.post('/access/assign-instructor', validateAssignInstructor, assignInstructor);

export default router;
