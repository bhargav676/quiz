import mongoose, { Schema } from 'mongoose';
import { IQuestion } from '../types';
import { QuestionType } from '../types/enums';

const optionSchema = new Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const questionSchema = new Schema<IQuestion>(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'Quiz ID is required'],
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: (v: unknown[]) => v.length >= 2 && v.length <= 6,
        message: 'A question must have between 2 and 6 options',
      },
    },
    correctAnswers: {
      type: [String],
      required: [true, 'Correct answers are required'],
      validate: {
        validator: (v: string[]) => v.length >= 1,
        message: 'At least one correct answer is required',
      },
    },
    type: {
      type: String,
      enum: Object.values(QuestionType),
      required: [true, 'Question type is required'],
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

// Index for quiz-based queries
questionSchema.index({ quizId: 1 });

export const Question = mongoose.model<IQuestion>('Question', questionSchema);
