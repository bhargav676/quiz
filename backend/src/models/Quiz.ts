import mongoose, { Schema } from 'mongoose';
import { IQuiz } from '../types';
import { QuizStatus, QuestionType } from '../types/enums';

const quizSchema = new Schema<IQuiz>(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    questionType: {
      type: String,
      enum: Object.values(QuestionType),
      default: QuestionType.SINGLE_SELECT,
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
      max: [480, 'Duration cannot exceed 480 minutes'],
    },
    scheduleTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(QuizStatus),
      default: QuizStatus.DRAFT,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
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

// Indexes
quizSchema.index({ status: 1 });
quizSchema.index({ createdBy: 1 });
quizSchema.index({ scheduleTime: 1, status: 1 });

export const Quiz = mongoose.model<IQuiz>('Quiz', quizSchema);
