// ==========================================
// Quiz Types
// ==========================================

export enum QuizStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum QuestionType {
  SINGLE_SELECT = 'SINGLE_SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
}

export interface Quiz {
  _id: string;
  title: string;
  description: string;
  questionType: QuestionType;
  duration: number;
  scheduleTime: string;
  status: QuizStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuizPayload {
  title: string;
  description?: string;
  questionType: QuestionType;
  duration: number;
  scheduleTime?: string;
}

export interface UpdateQuizPayload extends Partial<CreateQuizPayload> {}
