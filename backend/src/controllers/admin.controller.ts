import { Response } from 'express';
import { AuthRequest } from '../types';
import { User } from '../models/User';
import { Quiz } from '../models/Quiz';
import { Question } from '../models/Question';
import { Attempt } from '../models/Attempt';
import { Result } from '../models/Result';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { Role, QuizStatus } from '../types/enums';
import mongoose from 'mongoose';
import { updateQuizStatuses } from '../utils/quizStatusUpdater';

// GET /api/admin/dashboard
export const getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Update scheduled quizzes status dynamically
  await updateQuizStatuses();

  const [
    totalQuizzes,
    completedQuizzes,
    activeQuizzes,
    totalInstructors,
    totalParticipants,
  ] = await Promise.all([
    Quiz.countDocuments(),
    Quiz.countDocuments({ status: QuizStatus.COMPLETED }),
    Quiz.countDocuments({ status: { $in: [QuizStatus.LIVE, QuizStatus.SCHEDULED] } }),
    User.countDocuments({ role: Role.INSTRUCTOR }),
    User.countDocuments({ role: Role.PARTICIPANT }),
  ]);

  // Get recently completed quizzes with participant count and average scores
  const completedQuizList = await Quiz.find({ status: QuizStatus.COMPLETED })
    .sort({ scheduleTime: -1 })
    .limit(5);

  const completedQuizzesSummary = await Promise.all(
    completedQuizList.map(async (quiz) => {
      const attempts = await Attempt.find({ quizId: quiz._id });
      const attemptIds = attempts.map((a) => a._id);
      
      const results = await Result.find({ attemptId: { $in: attemptIds } });
      const avgPercentage = results.length > 0
        ? results.reduce((acc, r) => acc + r.percentage, 0) / results.length
        : 0;

      return {
        id: quiz._id,
        title: quiz.title,
        scheduleTime: quiz.scheduleTime,
        duration: quiz.duration,
        totalParticipants: attempts.length,
        averageScore: Math.round(avgPercentage * 10) / 10,
      };
    })
  );

  return ApiResponse.success(res, 'Dashboard statistics retrieved', {
    stats: {
      totalQuizzes,
      completedQuizzes,
      activeQuizzes,
      totalInstructors,
      totalParticipants,
    },
    completedQuizzesSummary,
  });
});

// GET /api/admin/quizzes
export const getAdminQuizzes = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Update scheduled quizzes status dynamically
  await updateQuizStatuses();

  const quizzes = await Quiz.find().sort({ createdAt: -1 });
  
  // Calculate participant counts for each quiz
  const quizzesWithStats = await Promise.all(
    quizzes.map(async (quiz) => {
      const participantCount = await Attempt.countDocuments({ quizId: quiz._id });
      return {
        ...quiz.toJSON(),
        id: quiz._id,
        participantCount,
      };
    })
  );

  return ApiResponse.success(res, 'Quizzes retrieved successfully', quizzesWithStats);
});

// GET /api/admin/quizzes/:id
export const getAdminQuizById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.badRequest(res, 'Invalid quiz ID');
  }

  // Update scheduled quizzes status dynamically
  await updateQuizStatuses();

  const quiz = await Quiz.findById(id);
  if (!quiz) {
    return ApiResponse.notFound(res, 'Quiz not found');
  }

  const questions = await Question.find({ quizId: quiz._id });

  return ApiResponse.success(res, 'Quiz retrieved successfully', {
    quiz,
    questions,
  });
});

// POST /api/admin/quizzes
export const createQuiz = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, description, questionType, duration, scheduleTime, questions } = req.body;
  const adminId = req.user?.id;

  if (!adminId) {
    return ApiResponse.unauthorized(res, 'User context not found');
  }

  // Determine starting status based on scheduleTime
  const schedDate = new Date(scheduleTime);
  const now = new Date();
  let status = QuizStatus.SCHEDULED;
  if (schedDate <= now) {
    status = QuizStatus.LIVE;
  }

  const quiz = new Quiz({
    title,
    description: description || '',
    questionType,
    duration: Number(duration),
    scheduleTime: schedDate,
    status,
    createdBy: new mongoose.Types.ObjectId(adminId),
  });

  await quiz.save();

  // Save questions
  const questionsToSave = questions.map((q: any) => ({
    quizId: quiz._id,
    questionText: q.questionText,
    options: q.options,
    correctAnswers: q.correctAnswers,
    type: questionType,
  }));

  const savedQuestions = await Question.insertMany(questionsToSave);

  return ApiResponse.created(res, 'Quiz created successfully', {
    quiz,
    questions: savedQuestions,
  });
});

// PUT /api/admin/quizzes/:id
export const updateQuiz = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { title, description, questionType, duration, scheduleTime, status, questions } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.badRequest(res, 'Invalid quiz ID');
  }

  const quiz = await Quiz.findById(id);
  if (!quiz) {
    return ApiResponse.notFound(res, 'Quiz not found');
  }

  if (quiz.status === QuizStatus.COMPLETED || quiz.status === QuizStatus.CANCELLED) {
    return ApiResponse.badRequest(res, `Cannot update a quiz that is already ${quiz.status}`);
  }

  // Update quiz fields
  quiz.title = title;
  quiz.description = description || '';
  quiz.questionType = questionType;
  quiz.duration = Number(duration);
  quiz.scheduleTime = new Date(scheduleTime);
  
  if (status && Object.values(QuizStatus).includes(status)) {
    quiz.status = status;
  } else {
    // Re-verify if it should be LIVE or SCHEDULED
    const now = new Date();
    if (quiz.scheduleTime <= now) {
      quiz.status = QuizStatus.LIVE;
    } else {
      quiz.status = QuizStatus.SCHEDULED;
    }
  }

  await quiz.save();

  // Sync questions by deleting existing and inserting updated
  await Question.deleteMany({ quizId: quiz._id });

  const questionsToSave = questions.map((q: any) => ({
    quizId: quiz._id,
    questionText: q.questionText,
    options: q.options,
    correctAnswers: q.correctAnswers,
    type: questionType,
  }));

  const savedQuestions = await Question.insertMany(questionsToSave);

  return ApiResponse.success(res, 'Quiz updated successfully', {
    quiz,
    questions: savedQuestions,
  });
});

// PATCH /api/admin/quizzes/:id/cancel
export const cancelQuiz = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.badRequest(res, 'Invalid quiz ID');
  }

  const quiz = await Quiz.findById(id);
  if (!quiz) {
    return ApiResponse.notFound(res, 'Quiz not found');
  }

  if (quiz.status === QuizStatus.COMPLETED || quiz.status === QuizStatus.CANCELLED) {
    return ApiResponse.badRequest(res, `Quiz is already ${quiz.status}`);
  }

  quiz.status = QuizStatus.CANCELLED;
  await quiz.save();

  return ApiResponse.success(res, 'Quiz cancelled successfully', quiz);
});

// GET /api/admin/quizzes/:id/results
export const getQuizResults = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.badRequest(res, 'Invalid quiz ID');
  }

  const quiz = await Quiz.findById(id);
  if (!quiz) {
    return ApiResponse.notFound(res, 'Quiz not found');
  }

  const attempts = await Attempt.find({ quizId: quiz._id })
    .populate('participantId', 'name email')
    .sort({ submittedAt: -1 });

  const attemptIds = attempts.map((a) => a._id);
  const results = await Result.find({ attemptId: { $in: attemptIds } });

  // Map results for faster lookup
  const resultsMap = new Map(results.map((r) => [r.attemptId.toString(), r]));

  // Calculate score bands for donut chart
  let fail = 0;      // < 40%
  let pass = 0;      // 40% - 70%
  let excellent = 0; // >= 70%

  const participantResults = attempts.map((attempt) => {
    const result = resultsMap.get(attempt._id.toString());
    const participant = attempt.participantId as unknown as { name: string; email: string };
    
    const percentage = result?.percentage ?? 0;
    
    if (result) {
      if (percentage < 40) {
        fail++;
      } else if (percentage < 70) {
        pass++;
      } else {
        excellent++;
      }
    }

    return {
      attemptId: attempt._id,
      participantName: participant?.name || 'Unknown',
      participantEmail: participant?.email || 'N/A',
      status: attempt.status,
      score: attempt.score,
      percentage: Math.round(percentage),
      correct: result?.correct ?? 0,
      wrong: result?.wrong ?? 0,
      skipped: result?.skipped ?? 0,
      timeTaken: result?.timeTaken ?? 0,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
    };
  });

  return ApiResponse.success(res, 'Quiz results retrieved successfully', {
    quiz: {
      id: quiz._id,
      title: quiz.title,
      status: quiz.status,
    },
    chartData: {
      fail,
      pass,
      excellent,
    },
    results: participantResults,
  });
});

// POST /api/admin/access/assign-instructor
export const assignInstructor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email } = req.body;

  let user = await User.findOne({ email });

  if (user) {
    if (user.role === Role.ADMIN) {
      return ApiResponse.badRequest(res, 'Cannot change the role of an admin');
    }
    user.role = Role.INSTRUCTOR;
    await user.save();
    return ApiResponse.success(res, `User role updated to instructor successfully`, {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    // Register new user as instructor with a default password
    user = new User({
      name: 'Instructor',
      email,
      password: 'instructor123', // auto-hashed in pre-save hook
      role: Role.INSTRUCTOR,
      isActive: true,
    });

    await user.save();
    return ApiResponse.created(res, `New instructor account created and assigned successfully`, {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      tempPassword: 'instructor123',
    });
  }
});
