import { Response } from 'express';
import { AuthRequest } from '../types';
import { User } from '../models/User';
import { Quiz } from '../models/Quiz';
import { Question } from '../models/Question';
import { QuizParticipant } from '../models/QuizParticipant';
import { Attempt } from '../models/Attempt';
import { Result } from '../models/Result';
import { Answer } from '../models/Answer';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { Role, QuizStatus, AttemptStatus } from '../types/enums';
import mongoose from 'mongoose';
import { updateQuizStatuses } from '../utils/quizStatusUpdater';

// GET /api/participant/quizzes
export const getParticipantQuizzes = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return ApiResponse.unauthorized(res, 'User context not found');
  }

  // Update scheduled quizzes status dynamically
  await updateQuizStatuses();

  // Find all quiz assignments for the user
  const assignments = await QuizParticipant.find({
    participantId: new mongoose.Types.ObjectId(userId),
  }).sort({ assignedAt: -1 });

  const quizIds = assignments.map((a) => a.quizId);

  // Load all assigned quizzes
  const quizzes = await Quiz.find({ _id: { $in: quizIds } });

  // Map quiz attempts
  const quizzesWithAttempts = await Promise.all(
    quizzes.map(async (quiz) => {
      const attempt = await Attempt.findOne({
        quizId: quiz._id,
        participantId: new mongoose.Types.ObjectId(userId),
      });

      const questionsCount = await Question.countDocuments({ quizId: quiz._id });

      return {
        ...quiz.toJSON(),
        id: quiz._id,
        questionsCount,
        attempt: attempt
          ? {
            id: attempt._id,
            status: attempt.status,
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt,
            score: attempt.score,
          }
          : null,
      };
    })
  );

  return ApiResponse.success(res, 'Participant quizzes retrieved successfully', quizzesWithAttempts);
});

// POST /api/participant/quizzes/:id/start
export const startAttempt = asyncHandler(async (req: AuthRequest, res: Response) => {
  const quizId = req.params.id as string;
  const userId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(quizId)) {
    return ApiResponse.badRequest(res, 'Invalid quiz ID');
  }

  // Update scheduled quizzes status dynamically
  await updateQuizStatuses();

  // Verify participant is assigned to the quiz
  const assignment = await QuizParticipant.findOne({
    quizId: new mongoose.Types.ObjectId(quizId),
    participantId: new mongoose.Types.ObjectId(userId),
  });

  if (!assignment) {
    return ApiResponse.forbidden(res, 'Access denied: you are not assigned to this quiz');
  }

  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return ApiResponse.notFound(res, 'Quiz not found');
  }

  // Quiz must be LIVE
  if (quiz.status !== QuizStatus.LIVE) {
    return ApiResponse.badRequest(res, `This quiz is currently ${quiz.status} and cannot be started`);
  }

  // Check if attempt already exists
  let attempt = await Attempt.findOne({
    quizId: quiz._id,
    participantId: new mongoose.Types.ObjectId(userId),
  });

  if (attempt) {
    if (attempt.status === AttemptStatus.SUBMITTED || attempt.status === AttemptStatus.AUTO_SUBMITTED) {
      return ApiResponse.badRequest(res, 'You have already submitted this quiz');
    }
    // Return existing in-progress attempt
    return ApiResponse.success(res, 'In-progress attempt resumed', {
      attemptId: attempt._id,
      startedAt: attempt.startedAt,
      duration: quiz.duration,
    });
  }

  // Create new attempt
  attempt = new Attempt({
    quizId: quiz._id,
    participantId: new mongoose.Types.ObjectId(userId),
    startedAt: new Date(),
    status: AttemptStatus.IN_PROGRESS,
    score: 0,
  });

  await attempt.save();

  return ApiResponse.created(res, 'Quiz attempt started successfully', {
    attemptId: attempt._id,
    startedAt: attempt.startedAt,
    duration: quiz.duration,
  });
});

// POST /api/participant/attempts/:id/answer
export const saveAnswer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const attemptId = req.params.id as string;
  const userId = req.user?.id;
  const { questionId, selectedAnswers } = req.body;

  if (!mongoose.Types.ObjectId.isValid(attemptId) || !mongoose.Types.ObjectId.isValid(questionId)) {
    return ApiResponse.badRequest(res, 'Invalid attempt or question ID');
  }

  const attempt = await Attempt.findById(attemptId);
  if (!attempt) {
    return ApiResponse.notFound(res, 'Attempt not found');
  }

  // Verify ownership and in-progress status
  if (attempt.participantId.toString() !== userId) {
    return ApiResponse.forbidden(res, 'Access denied');
  }

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    return ApiResponse.badRequest(res, 'This assessment has already been closed');
  }

  if (!Array.isArray(selectedAnswers)) {
    return ApiResponse.badRequest(res, 'selectedAnswers must be an array of option labels');
  }

  // Save or update answer
  const answer = await Answer.findOneAndUpdate(
    {
      attemptId: new mongoose.Types.ObjectId(attemptId),
      questionId: new mongoose.Types.ObjectId(questionId),
    },
    { selectedAnswers },
    { upsert: true, new: true }
  );

  return ApiResponse.success(res, 'Answer saved successfully', answer);
});

// POST /api/participant/attempts/:id/submit
export const submitAttempt = asyncHandler(async (req: AuthRequest, res: Response) => {
  const attemptId = req.params.id as string;
  const userId = req.user?.id;
  const { isAutoSubmit } = req.body;

  if (!mongoose.Types.ObjectId.isValid(attemptId)) {
    return ApiResponse.badRequest(res, 'Invalid attempt ID');
  }

  const attempt = await Attempt.findById(attemptId);
  if (!attempt) {
    return ApiResponse.notFound(res, 'Attempt not found');
  }

  if (attempt.participantId.toString() !== userId) {
    return ApiResponse.forbidden(res, 'Access denied');
  }

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    return ApiResponse.badRequest(res, 'Attempt is already submitted');
  }

  // Submit attempt
  attempt.status = isAutoSubmit ? AttemptStatus.AUTO_SUBMITTED : AttemptStatus.SUBMITTED;
  attempt.submittedAt = new Date();

  // Load questions and saved answers to calculate score
  const [questions, savedAnswers] = await Promise.all([
    Question.find({ quizId: attempt.quizId }),
    Answer.find({ attemptId: attempt._id }),
  ]);

  const answersMap = new Map(savedAnswers.map((a) => [a.questionId.toString(), a.selectedAnswers]));

  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;

  questions.forEach((q) => {
    const selected = answersMap.get(q._id.toString());

    if (!selected || selected.length === 0) {
      skippedCount++;
    } else {
      // Sort to do array equality check for multi select
      const correctSorted = [...q.correctAnswers].sort();
      const selectedSorted = [...selected].sort();

      const isCorrect =
        correctSorted.length === selectedSorted.length &&
        correctSorted.every((val, index) => val === selectedSorted[index]);

      if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }
    }
  });

  const totalQuestions = questions.length;
  const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

  // Save raw score in attempt
  attempt.score = correctCount;
  await attempt.save();

  // Save result summary
  const timeTaken = Math.round((attempt.submittedAt.getTime() - attempt.startedAt.getTime()) / 1000);

  const result = new Result({
    attemptId: attempt._id,
    score: correctCount,
    percentage,
    correct: correctCount,
    wrong: wrongCount,
    skipped: skippedCount,
    timeTaken,
  });

  await result.save();

  return ApiResponse.success(res, 'Quiz submitted successfully', {
    attemptId: attempt._id,
    status: attempt.status,
    score: correctCount,
    totalQuestions,
    percentage: Math.round(percentage),
    correct: correctCount,
    wrong: wrongCount,
    skipped: skippedCount,
    timeTaken,
  });
});

// GET /api/participant/attempts/:id/result
export const getAttemptResult = asyncHandler(async (req: AuthRequest, res: Response) => {
  const attemptId = req.params.id as string;
  const userId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(attemptId)) {
    return ApiResponse.badRequest(res, 'Invalid attempt ID');
  }

  const attempt = await Attempt.findById(attemptId).populate('quizId', 'title duration');
  if (!attempt) {
    return ApiResponse.notFound(res, 'Attempt not found');
  }

  if (attempt.participantId.toString() !== userId) {
    return ApiResponse.forbidden(res, 'Access denied');
  }

  const result = await Result.findOne({ attemptId: attempt._id });
  if (!result) {
    return ApiResponse.notFound(res, 'Result summary not found');
  }

  return ApiResponse.success(res, 'Result summary retrieved successfully', {
    quizTitle: (attempt.quizId as any).title,
    duration: (attempt.quizId as any).duration,
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    result: {
      score: result.score,
      percentage: Math.round(result.percentage),
      correct: result.correct,
      wrong: result.wrong,
      skipped: result.skipped,
      timeTaken: result.timeTaken,
    },
  });
});

// GET /api/participant/attempts/:id/details
export const getAttemptDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
  const attemptId = req.params.id as string;
  const userId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(attemptId)) {
    return ApiResponse.badRequest(res, 'Invalid attempt ID');
  }

  const attempt = await Attempt.findById(attemptId);
  if (!attempt) {
    return ApiResponse.notFound(res, 'Attempt not found');
  }

  if (attempt.participantId.toString() !== userId) {
    return ApiResponse.forbidden(res, 'Access denied');
  }

  const quiz = await Quiz.findById(attempt.quizId);
  if (!quiz) {
    return ApiResponse.notFound(res, 'Quiz not found');
  }

  const [questions, savedAnswers] = await Promise.all([
    Question.find({ quizId: quiz._id }),
    Answer.find({ attemptId: attempt._id }),
  ]);

  const answersMap = new Map(savedAnswers.map((a) => [a.questionId.toString(), a.selectedAnswers]));

  const questionsWithAnswers = questions.map((q) => {
    const selected = answersMap.get(q._id.toString()) || [];
    const correctSorted = [...q.correctAnswers].sort();
    const selectedSorted = [...selected].sort();
    const isCorrect =
      correctSorted.length === selectedSorted.length &&
      correctSorted.every((val, index) => val === selectedSorted[index]);

    const isInProgress = attempt.status === AttemptStatus.IN_PROGRESS;

    return {
      id: q._id,
      questionText: q.questionText,
      options: q.options,
      correctAnswers: isInProgress ? [] : q.correctAnswers,
      selectedAnswers: selected,
      isCorrect: isInProgress ? false : (selected.length > 0 && isCorrect),
      isSkipped: selected.length === 0,
    };
  });

  return ApiResponse.success(res, 'Question diagnostics retrieved', {
    quizTitle: quiz.title,
    questions: questionsWithAnswers,
  });
});
