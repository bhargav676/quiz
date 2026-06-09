import { Request } from 'express';
import { Document, Types } from 'mongoose';
import { Role, QuizStatus, QuestionType, AttemptStatus } from './enums';

// ==========================================
// User Types
// ==========================================
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// ==========================================
// Quiz Types
// ==========================================
export interface IQuiz extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  questionType: QuestionType;
  duration: number; // in minutes
  scheduleTime: Date;
  status: QuizStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Question Types
// ==========================================
export interface IOption {
  label: string;
  text: string;
}

export interface IQuestion extends Document {
  _id: Types.ObjectId;
  quizId: Types.ObjectId;
  questionText: string;
  options: IOption[];
  correctAnswers: string[];
  type: QuestionType;
}

// ==========================================
// Quiz Participant Types
// ==========================================
export interface IQuizParticipant extends Document {
  _id: Types.ObjectId;
  quizId: Types.ObjectId;
  participantId: Types.ObjectId;
  assignedAt: Date;
}

// ==========================================
// Attempt Types
// ==========================================
export interface IAttempt extends Document {
  _id: Types.ObjectId;
  quizId: Types.ObjectId;
  participantId: Types.ObjectId;
  startedAt: Date;
  submittedAt?: Date;
  status: AttemptStatus;
  score: number;
}

// ==========================================
// Answer Types
// ==========================================
export interface IAnswer extends Document {
  _id: Types.ObjectId;
  attemptId: Types.ObjectId;
  questionId: Types.ObjectId;
  selectedAnswers: string[];
}

// ==========================================
// Result Types
// ==========================================
export interface IResult extends Document {
  _id: Types.ObjectId;
  attemptId: Types.ObjectId;
  score: number;
  percentage: number;
  correct: number;
  wrong: number;
  skipped: number;
  timeTaken: number; // in seconds
}

// ==========================================
// Auth Types
// ==========================================
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: Role;
  };
}

export interface TokenPayload {
  id: string;
  role: Role;
}

// ==========================================
// API Response Types
// ==========================================
export interface ApiResponseData<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
