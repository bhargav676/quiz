import mongoose, { Schema } from 'mongoose';
import { IResult } from '../types';

const resultSchema = new Schema<IResult>(
  {
    attemptId: {
      type: Schema.Types.ObjectId,
      ref: 'Attempt',
      required: [true, 'Attempt ID is required'],
      unique: true,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    percentage: {
      type: Number,
      required: true,
      default: 0,
    },
    correct: {
      type: Number,
      required: true,
      default: 0,
    },
    wrong: {
      type: Number,
      required: true,
      default: 0,
    },
    skipped: {
      type: Number,
      required: true,
      default: 0,
    },
    timeTaken: {
      type: Number, // in seconds
      required: true,
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

export const Result = mongoose.model<IResult>('Result', resultSchema);
