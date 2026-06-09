// ==========================================
// Result Types
// ==========================================

export interface Result {
  _id: string;
  attemptId: string;
  score: number;
  percentage: number;
  correct: number;
  wrong: number;
  skipped: number;
  timeTaken: number;
}

export interface DetailedResult extends Result {
  quiz: {
    _id: string;
    title: string;
    duration: number;
  };
  participant: {
    _id: string;
    name: string;
    email: string;
  };
}
