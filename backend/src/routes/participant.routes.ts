import { Router } from 'express';
import {
  getParticipantQuizzes,
  startAttempt,
  saveAnswer,
  submitAttempt,
  getAttemptResult,
  getAttemptDetails,
} from '../controllers/participant.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { Role } from '../types/enums';

const router = Router();

// Protect all participant routes to logged-in users with PARTICIPANT role
router.use(authMiddleware);
router.use(roleMiddleware([Role.PARTICIPANT]));

router.get('/quizzes', getParticipantQuizzes);
router.post('/quizzes/:id/start', startAttempt);
router.post('/attempts/:id/answer', saveAnswer);
router.post('/attempts/:id/submit', submitAttempt);
router.get('/attempts/:id/result', getAttemptResult);
router.get('/attempts/:id/details', getAttemptDetails);

export default router;
