import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { QuestionType } from '../types/enums';

export const validateQuiz = (req: Request, res: Response, next: NextFunction): void => {
  const { title, duration, scheduleTime, questionType, questions } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    ApiResponse.badRequest(res, 'Title must be at least 3 characters long');
    return;
  }

  const durationMinutes = Number(duration);
  if (isNaN(durationMinutes) || durationMinutes <= 0) {
    ApiResponse.badRequest(res, 'Duration must be a positive number of minutes');
    return;
  }

  if (!scheduleTime || isNaN(Date.parse(scheduleTime))) {
    ApiResponse.badRequest(res, 'Please provide a valid schedule date and time');
    return;
  }

  if (!questionType || !Object.values(QuestionType).includes(questionType)) {
    ApiResponse.badRequest(res, 'Please provide a valid question type (SINGLE_SELECT or MULTI_SELECT)');
    return;
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    ApiResponse.badRequest(res, 'A quiz must contain at least 1 question');
    return;
  }

  // Validate each question
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.questionText || typeof q.questionText !== 'string' || q.questionText.trim().length === 0) {
      ApiResponse.badRequest(res, `Question ${i + 1} text is required`);
      return;
    }

    if (!Array.isArray(q.options) || q.options.length < 2) {
      ApiResponse.badRequest(res, `Question ${i + 1} must have at least 2 options`);
      return;
    }

    for (let oIdx = 0; oIdx < q.options.length; oIdx++) {
      const opt = q.options[oIdx];
      if (!opt.label || typeof opt.label !== 'string' || !opt.text || typeof opt.text !== 'string') {
        ApiResponse.badRequest(res, `Question ${i + 1} option ${oIdx + 1} must have a label and text`);
        return;
      }
    }

    if (!Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0) {
      ApiResponse.badRequest(res, `Question ${i + 1} must have at least 1 correct answer`);
      return;
    }

    // Verify correctAnswers are valid option labels
    const validLabels = q.options.map((opt: { label: string }) => opt.label);
    for (const correctAns of q.correctAnswers) {
      if (!validLabels.includes(correctAns)) {
        ApiResponse.badRequest(res, `Question ${i + 1} correct answer "${correctAns}" must match one of the option labels`);
        return;
      }
    }

    if (questionType === QuestionType.SINGLE_SELECT && q.correctAnswers.length > 1) {
      ApiResponse.badRequest(res, `Question ${i + 1} is SINGLE_SELECT but has multiple correct answers`);
      return;
    }
  }

  next();
};

export const validateAssignInstructor = (req: Request, res: Response, next: NextFunction): void => {
  const { email } = req.body;
  const emailRegex = /^\S+@\S+\.\S+$/;

  if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
    ApiResponse.badRequest(res, 'Please provide a valid email address');
    return;
  }

  next();
};
