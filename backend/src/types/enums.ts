// ==========================================
// Role Enum
// ==========================================
export enum Role {
  ADMIN = 'ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
  PARTICIPANT = 'PARTICIPANT',
}

// ==========================================
// Quiz Status Enum
// ==========================================
export enum QuizStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

// ==========================================
// Question Type Enum
// ==========================================
export enum QuestionType {
  SINGLE_SELECT = 'SINGLE_SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
}

// ==========================================
// Attempt Status Enum
// ==========================================
export enum AttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  AUTO_SUBMITTED = 'AUTO_SUBMITTED',
}
