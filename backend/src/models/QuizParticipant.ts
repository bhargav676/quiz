import mongoose, { Schema } from 'mongoose';
import { IQuizParticipant } from '../types';

const quizParticipantSchema = new Schema<IQuizParticipant>(
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
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: {
      transform(_doc: unknown, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound unique index — a user can only be assigned once per quiz
quizParticipantSchema.index({ quizId: 1, participantId: 1 }, { unique: true });

export const QuizParticipant = mongoose.model<IQuizParticipant>(
  'QuizParticipant',
  quizParticipantSchema
);
