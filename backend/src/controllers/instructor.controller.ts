import { Response, Request } from 'express';
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
import { Role, QuizStatus, QuestionType, AttemptStatus } from '../types/enums';
import mongoose from 'mongoose';
import stream from 'stream';
import csv from 'csv-parser';
import { updateQuizStatuses } from '../utils/quizStatusUpdater';

// Helper to parse CSV buffer using streams
const parseCSVBuffer = (buffer: Buffer): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    bufferStream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

// GET /api/instructor/quizzes
export const getInstructorQuizzes = asyncHandler(async (req: AuthRequest, res: Response) => {
  const instructorId = req.user?.id;

  if (!instructorId) {
    return ApiResponse.unauthorized(res, 'User context not found');
  }

  // Update scheduled quizzes status dynamically
  await updateQuizStatuses();

  const quizzes = await Quiz.find({ createdBy: new mongoose.Types.ObjectId(instructorId) }).sort({ createdAt: -1 });

  const quizzesWithReadiness = await Promise.all(
    quizzes.map(async (quiz) => {
      const questionsCount = await Question.countDocuments({ quizId: quiz._id });
      const participantsCount = await QuizParticipant.countDocuments({ quizId: quiz._id });
      const attemptsCount = await Attempt.countDocuments({ quizId: quiz._id });

      const hasQuestions = questionsCount > 0;
      const hasParticipants = participantsCount > 0;
      const isReady = quiz.duration > 0 && hasQuestions && hasParticipants && !!quiz.scheduleTime;

      return {
        ...quiz.toJSON(),
        id: quiz._id,
        questionsCount,
        participantsCount,
        attemptsCount,
        readiness: {
          hasQuestions,
          hasParticipants,
          isReady,
        },
      };
    })
  );

  return ApiResponse.success(res, 'Instructor quizzes retrieved', quizzesWithReadiness);
});

// POST /api/instructor/quizzes
export const createInstructorQuiz = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, description, duration, scheduleTime, questionType } = req.body;
  const instructorId = req.user?.id;

  if (!instructorId) {
    return ApiResponse.unauthorized(res, 'User context not found');
  }

  const quiz = new Quiz({
    title: title || 'Untitled Quiz',
    description: description || '',
    duration: Number(duration) || 0,
    scheduleTime: scheduleTime ? new Date(scheduleTime) : new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
    questionType: questionType || QuestionType.SINGLE_SELECT,
    status: QuizStatus.DRAFT,
    createdBy: new mongoose.Types.ObjectId(instructorId),
  });

  await quiz.save();

  return ApiResponse.created(res, 'Quiz draft created successfully', {
    ...quiz.toJSON(),
    id: quiz._id,
  });
});

// GET /api/instructor/quizzes/:id
export const getInstructorQuizById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const instructorId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.badRequest(res, 'Invalid quiz ID');
  }

  // Update scheduled quizzes status dynamically
  await updateQuizStatuses();

  const quiz = await Quiz.findById(id);
  if (!quiz) {
    return ApiResponse.notFound(res, 'Quiz not found');
  }

  // Verify ownership
  if (quiz.createdBy.toString() !== instructorId) {
    return ApiResponse.forbidden(res, 'Access denied: you do not own this quiz');
  }

  const [questions, participants] = await Promise.all([
    Question.find({ quizId: quiz._id }),
    QuizParticipant.find({ quizId: quiz._id }).populate('participantId', 'name email'),
  ]);

  const mappedParticipants = participants.map((p: any) => ({
    id: p.participantId?._id,
    name: p.participantId?.name || 'Unknown',
    email: p.participantId?.email || 'N/A',
    assignedAt: p.assignedAt,
  }));

  return ApiResponse.success(res, 'Quiz details retrieved successfully', {
    quiz: {
      ...quiz.toJSON(),
      id: quiz._id,
    },
    questions,
    participants: mappedParticipants,
  });
});

// PUT /api/instructor/quizzes/:id
export const updateInstructorQuiz = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const instructorId = req.user?.id;
  const { title, description, duration, scheduleTime, questionType } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.badRequest(res, 'Invalid quiz ID');
  }

  const quiz = await Quiz.findById(id);
  if (!quiz) {
    return ApiResponse.notFound(res, 'Quiz not found');
  }

  if (quiz.createdBy.toString() !== instructorId) {
    return ApiResponse.forbidden(res, 'Access denied');
  }

  if (quiz.status === QuizStatus.COMPLETED || quiz.status === QuizStatus.CANCELLED) {
    return ApiResponse.badRequest(res, `Cannot update a quiz that is ${quiz.status}`);
  }

  // Update properties
  quiz.title = title || quiz.title;
  quiz.description = description !== undefined ? description : quiz.description;
  quiz.duration = duration !== undefined ? Number(duration) : quiz.duration;
  quiz.scheduleTime = scheduleTime ? new Date(scheduleTime) : quiz.scheduleTime;
  quiz.questionType = questionType || quiz.questionType;

  await quiz.save();

  return ApiResponse.success(res, 'Quiz details updated successfully', {
    ...quiz.toJSON(),
    id: quiz._id,
  });
});

// PATCH /api/instructor/quizzes/:id/publish
export const publishQuiz = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const instructorId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.badRequest(res, 'Invalid quiz ID');
  }

  const quiz = await Quiz.findById(id);
  if (!quiz) {
    return ApiResponse.notFound(res, 'Quiz not found');
  }

  if (quiz.createdBy.toString() !== instructorId) {
    return ApiResponse.forbidden(res, 'Access denied');
  }

  // Check readiness
  const questionsCount = await Question.countDocuments({ quizId: quiz._id });
  const participantsCount = await QuizParticipant.countDocuments({ quizId: quiz._id });

  if (questionsCount === 0 || participantsCount === 0 || quiz.duration <= 0) {
    return ApiResponse.badRequest(res, 'Cannot publish: quiz must have questions, participants, and a positive duration');
  }

  const now = new Date();
  if (quiz.scheduleTime <= now) {
    quiz.status = QuizStatus.LIVE;
  } else {
    quiz.status = QuizStatus.SCHEDULED;
  }

  await quiz.save();

  return ApiResponse.success(res, `Quiz published successfully as ${quiz.status}`, {
    ...quiz.toJSON(),
    id: quiz._id,
  });
});

// PATCH /api/instructor/quizzes/:id/cancel
export const cancelInstructorQuiz = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const instructorId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.badRequest(res, 'Invalid quiz ID');
  }

  const quiz = await Quiz.findById(id);
  if (!quiz) {
    return ApiResponse.notFound(res, 'Quiz not found');
  }

  if (quiz.createdBy.toString() !== instructorId) {
    return ApiResponse.forbidden(res, 'Access denied');
  }

  if (quiz.status === QuizStatus.COMPLETED || quiz.status === QuizStatus.CANCELLED) {
    return ApiResponse.badRequest(res, `Quiz is already ${quiz.status}`);
  }

  quiz.status = QuizStatus.CANCELLED;
  await quiz.save();

  return ApiResponse.success(res, 'Quiz cancelled successfully', {
    ...quiz.toJSON(),
    id: quiz._id,
  });
});

// POST /api/instructor/quizzes/:id/questions
export const addQuestionsManual = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const instructorId = req.user?.id;
  const { questions } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.badRequest(res, 'Invalid quiz ID');
  }

  const quiz = await Quiz.findById(id);
  if (!quiz) {
    return ApiResponse.notFound(res, 'Quiz not found');
  }

  if (quiz.createdBy.toString() !== instructorId) {
    return ApiResponse.forbidden(res, 'Access denied');
  }

  if (!Array.isArray(questions)) {
    return ApiResponse.badRequest(res, 'Questions must be an array');
  }

  // Clear existing questions and write new ones
  await Question.deleteMany({ quizId: quiz._id });

  const questionsToSave = questions.map((q) => ({
    quizId: quiz._id,
    questionText: q.questionText,
    options: q.options,
    correctAnswers: q.correctAnswers,
    type: quiz.questionType,
  }));

  const savedQuestions = await Question.insertMany(questionsToSave);

  return ApiResponse.success(res, 'Questions saved successfully', savedQuestions);
});

// POST /api/instructor/quizzes/:id/questions/csv
export const uploadQuestionsCSV = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const instructorId = req.user?.id;

  if (!req.file) {
    return ApiResponse.badRequest(res, 'Please upload a CSV file');
  }

  const quiz = await Quiz.findById(id);
  if (!quiz) {
    return ApiResponse.notFound(res, 'Quiz not found');
  }

  if (quiz.createdBy.toString() !== instructorId) {
    return ApiResponse.forbidden(res, 'Access denied');
  }

  try {
    const csvRows = await parseCSVBuffer(req.file.buffer);
    const parsedQuestions: any[] = [];

    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      const { questionText, optionA, optionB, optionC, optionD, correctAnswers } = row;

      if (!questionText || !optionA || !optionB || !correctAnswers) {
        return ApiResponse.badRequest(
          res,
          `Row ${i + 1} is missing required columns (questionText, optionA, optionB, correctAnswers)`
        );
      }

      const options = [
        { label: 'A', text: optionA.trim() },
        { label: 'B', text: optionB.trim() },
      ];

      if (optionC) options.push({ label: 'C', text: optionC.trim() });
      if (optionD) options.push({ label: 'D', text: optionD.trim() });

      const correctAnsArray = correctAnswers
        .split(',')
        .map((s: string) => s.trim().toUpperCase());

      parsedQuestions.push({
        quizId: quiz._id,
        questionText: questionText.trim(),
        options,
        correctAnswers: correctAnsArray,
        type: quiz.questionType,
      });
    }

    // Overwrite questions
    await Question.deleteMany({ quizId: quiz._id });
    const saved = await Question.insertMany(parsedQuestions);

    return ApiResponse.success(res, `Successfully parsed and loaded ${saved.length} questions`, saved);
  } catch (err: any) {
    return ApiResponse.error(res, err.message || 'Error processing CSV file');
  }
});

// POST /api/instructor/quizzes/:id/participants
export const addParticipantsManual = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const instructorId = req.user?.id;
  const { emails } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.badRequest(res, 'Invalid quiz ID');
  }

  const quiz = await Quiz.findById(id);
  if (!quiz) {
    return ApiResponse.notFound(res, 'Quiz not found');
  }

  if (quiz.createdBy.toString() !== instructorId) {
    return ApiResponse.forbidden(res, 'Access denied');
  }

  if (!Array.isArray(emails) || emails.length === 0) {
    return ApiResponse.badRequest(res, 'Emails array is required');
  }

  const assignedParticipants: any[] = [];

  for (const email of emails) {
    const formattedEmail = email.trim().toLowerCase();

    // Find or create participant
    let user = await User.findOne({ email: formattedEmail });
    if (!user) {
      user = new User({
        name: formattedEmail.split('@')[0],
        email: formattedEmail,
        password: 'password123', // auto-hashed in pre-save
        role: Role.PARTICIPANT,
        isActive: true,
      });
      await user.save();
    }

    // Check if already assigned
    const alreadyAssigned = await QuizParticipant.findOne({
      quizId: quiz._id,
      participantId: user._id,
    });

    if (!alreadyAssigned) {
      const assignment = new QuizParticipant({
        quizId: quiz._id,
        participantId: user._id,
        assignedAt: new Date(),
      });
      await assignment.save();
    }

    assignedParticipants.push({
      id: user._id,
      name: user.name,
      email: user.email,
    });
  }

  return ApiResponse.success(res, `Successfully assigned ${assignedParticipants.length} participants`, assignedParticipants);
});

// POST /api/instructor/quizzes/:id/participants/csv
export const uploadParticipantsCSV = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const instructorId = req.user?.id;

  if (!req.file) {
    return ApiResponse.badRequest(res, 'Please upload a CSV file');
  }

  const quiz = await Quiz.findById(id);
  if (!quiz) {
    return ApiResponse.notFound(res, 'Quiz not found');
  }

  if (quiz.createdBy.toString() !== instructorId) {
    return ApiResponse.forbidden(res, 'Access denied');
  }

  try {
    const csvRows = await parseCSVBuffer(req.file.buffer);
    const emails: string[] = [];

    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      const email = row.email || row.Email;

      if (!email) {
        return ApiResponse.badRequest(res, `Row ${i + 1} is missing email column`);
      }
      emails.push(email.trim());
    }

    if (emails.length === 0) {
      return ApiResponse.badRequest(res, 'CSV file has no email records');
    }

    // Re-use manual assign logic
    const assignedParticipants: any[] = [];

    for (const email of emails) {
      const formattedEmail = email.toLowerCase();
      let user = await User.findOne({ email: formattedEmail });
      if (!user) {
        user = new User({
          name: formattedEmail.split('@')[0],
          email: formattedEmail,
          password: 'password123',
          role: Role.PARTICIPANT,
          isActive: true,
        });
        await user.save();
      }

      const alreadyAssigned = await QuizParticipant.findOne({
        quizId: quiz._id,
        participantId: user._id,
      });

      if (!alreadyAssigned) {
        const assignment = new QuizParticipant({
          quizId: quiz._id,
          participantId: user._id,
          assignedAt: new Date(),
        });
        await assignment.save();
      }

      assignedParticipants.push({
        id: user._id,
        name: user.name,
        email: user.email,
      });
    }

    return ApiResponse.success(res, `Successfully loaded ${assignedParticipants.length} participants`, assignedParticipants);
  } catch (err: any) {
    return ApiResponse.error(res, err.message || 'Error processing CSV file');
  }
});

// GET /api/instructor/quizzes/:id/analytics
export const getQuizAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const instructorId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.badRequest(res, 'Invalid quiz ID');
  }

  const quiz = await Quiz.findById(id);
  if (!quiz) {
    return ApiResponse.notFound(res, 'Quiz not found');
  }

  if (quiz.createdBy.toString() !== instructorId) {
    return ApiResponse.forbidden(res, 'Access denied');
  }

  const attempts = await Attempt.find({ quizId: quiz._id })
    .populate('participantId', 'name email')
    .sort({ submittedAt: -1 });

  const attemptIds = attempts.map((a) => a._id);
  const results = await Result.find({ attemptId: { $in: attemptIds } });
  const resultsMap = new Map(results.map((r) => [r.attemptId.toString(), r]));

  // 1. Calculate Score Bands
  let fail = 0;
  let pass = 0;
  let excellent = 0;

  const totalAttempts = attempts.length;
  const avgPercentage = totalAttempts > 0
    ? results.reduce((acc, r) => acc + r.percentage, 0) / results.length
    : 0;

  results.forEach((r) => {
    if (r.percentage < 40) {
      fail++;
    } else if (r.percentage < 70) {
      pass++;
    } else {
      excellent++;
    }
  });

  // 2. Question-by-Question breakdown analysis
  const questions = await Question.find({ quizId: quiz._id });
  const answers = await Answer.find({ attemptId: { $in: attemptIds } });

  const qBreakdown = questions.map((q) => {
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    // Filter answers for this question
    const qAnswers = answers.filter((a) => a.questionId.toString() === q._id.toString());

    // Group answers by attemptId for quick lookup
    const attemptAnswersMap = new Map(qAnswers.map((a) => [a.attemptId.toString(), a]));

    attempts.forEach((attempt) => {
      const answer = attemptAnswersMap.get(attempt._id.toString());

      if (!answer || answer.selectedAnswers.length === 0) {
        skippedCount++;
      } else {
        // Compare sorted correctAnswers and selectedAnswers arrays
        const correct = [...q.correctAnswers].sort();
        const selected = [...answer.selectedAnswers].sort();
        const isCorrect = correct.length === selected.length && correct.every((val, index) => val === selected[index]);

        if (isCorrect) {
          correctCount++;
        } else {
          wrongCount++;
        }
      }
    });

    const totalResponded = correctCount + wrongCount + skippedCount;
    const accuracy = totalResponded > 0 ? Math.round((correctCount / totalResponded) * 100) : 0;

    return {
      id: q._id,
      questionText: q.questionText,
      correctCount,
      wrongCount,
      skippedCount,
      accuracy,
    };
  });

  const participantAttempts = attempts.map((attempt) => {
    const result = resultsMap.get(attempt._id.toString());
    const participant = attempt.participantId as unknown as { name: string; email: string };

    return {
      attemptId: attempt._id,
      participantName: participant?.name || 'Unknown',
      participantEmail: participant?.email || 'N/A',
      status: attempt.status,
      percentage: result ? Math.round(result.percentage) : 0,
      timeTaken: result?.timeTaken ?? 0,
      submittedAt: attempt.submittedAt,
    };
  });

  return ApiResponse.success(res, 'Quiz analytics calculated successfully', {
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
    metrics: {
      totalAttempts,
      averageScore: Math.round(avgPercentage * 10) / 10,
    },
    questionsBreakdown: qBreakdown,
    attempts: participantAttempts,
  });
});
