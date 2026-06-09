import mongoose, { Schema } from 'mongoose';
import { IAnswer } from '../types';

const answerSchema = new Schema<IAnswer>(
  {
    attemptId: {
      type: Schema.Types.ObjectId,
      ref: 'Attempt',
      required: [true, 'Attempt ID is required'],
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: [true, 'Question ID is required'],
    },
    selectedAnswers: {
      type: [String],
      default: [],
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

// Compound unique index — one answer per question per attempt
answerSchema.index({ attemptId: 1, questionId: 1 }, { unique: true });

export const Answer = mongoose.model<IAnswer>('Answer', answerSchema);
