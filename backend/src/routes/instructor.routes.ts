import { Router } from 'express';
import {
  getInstructorQuizzes,
  createInstructorQuiz,
  getInstructorQuizById,
  updateInstructorQuiz,
  publishQuiz,
  cancelInstructorQuiz,
  addQuestionsManual,
  uploadQuestionsCSV,
  addParticipantsManual,
  uploadParticipantsCSV,
  getQuizAnalytics,
} from '../controllers/instructor.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { uploadCSV } from '../middlewares/csv.middleware';
import { Role } from '../types/enums';

const router = Router();

// Protect all instructor routes to logged-in users with INSTRUCTOR or ADMIN roles
router.use(authMiddleware);
router.use(roleMiddleware([Role.INSTRUCTOR, Role.ADMIN]));

router.get('/quizzes', getInstructorQuizzes);
router.post('/quizzes', createInstructorQuiz);
router.get('/quizzes/:id', getInstructorQuizById);
router.put('/quizzes/:id', updateInstructorQuiz);
router.patch('/quizzes/:id/publish', publishQuiz);
router.patch('/quizzes/:id/cancel', cancelInstructorQuiz);
router.post('/quizzes/:id/questions', addQuestionsManual);
router.post('/quizzes/:id/questions/csv', uploadCSV.single('file'), uploadQuestionsCSV);
router.post('/quizzes/:id/participants', addParticipantsManual);
router.post('/quizzes/:id/participants/csv', uploadCSV.single('file'), uploadParticipantsCSV);
router.get('/quizzes/:id/analytics', getQuizAnalytics);

export default router;
