import mongoose, { Schema } from 'mongoose';
import { IAttempt } from '../types';
import { AttemptStatus } from '../types/enums';

const attemptSchema = new Schema<IAttempt>(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'Quiz ID is required'],
    },
    participantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Participant ID is required'],
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(AttemptStatus),
      default: AttemptStatus.IN_PROGRESS,
    },
    score: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: unknown, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound unique index — one attempt per user per quiz
attemptSchema.index({ quizId: 1, participantId: 1 }, { unique: true });
attemptSchema.index({ status: 1 });

export const Attempt = mongoose.model<IAttempt>('Attempt', attemptSchema);
