// ==========================================
// Question Types
// ==========================================

import { QuestionType } from './quiz';

export interface Option {
  label: string;
  text: string;
}

export interface Question {
  _id: string;
  quizId: string;
  questionText: string;
  options: Option[];
  correctAnswers: string[];
  type: QuestionType;
}

export interface CreateQuestionPayload {
  questionText: string;
  options: Option[];
  correctAnswers: string[];
  type: QuestionType;
}
