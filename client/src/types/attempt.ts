// ==========================================
// Attempt Types
// ==========================================

export enum AttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  AUTO_SUBMITTED = 'AUTO_SUBMITTED',
}

export interface Attempt {
  _id: string;
  quizId: string;
  participantId: string;
  startedAt: string;
  submittedAt?: string;
  status: AttemptStatus;
  score: number;
}

export interface SaveAnswerPayload {
  attemptId: string;
  questionId: string;
  selectedAnswers: string[];
}
