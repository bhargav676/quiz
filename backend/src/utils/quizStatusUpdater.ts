import { Quiz } from '../models/Quiz';
import { QuizStatus } from '../types/enums';

export const updateQuizStatuses = async (): Promise<void> => {
  try {
    const now = new Date();

    // 1. Transition SCHEDULED -> LIVE when scheduleTime has arrived/passed
    const scheduledToLive = await Quiz.updateMany(
      {
        status: QuizStatus.SCHEDULED,
        scheduleTime: { $lte: now },
      },
      {
        $set: { status: QuizStatus.LIVE },
      }
    );

    if (scheduledToLive.modifiedCount > 0) {
      console.log(`[QuizStatusUpdater] Transitioned ${scheduledToLive.modifiedCount} quizzes from SCHEDULED to LIVE.`);
    }

    // 2. Transition LIVE -> COMPLETED when scheduleTime + duration (in minutes) has passed
    const liveToCompleted = await Quiz.updateMany(
      {
        status: QuizStatus.LIVE,
        scheduleTime: { $ne: null },
        $expr: {
          $lte: [
            { $add: ['$scheduleTime', { $multiply: ['$duration', 60000] }] },
            now,
          ],
        },
      },
      {
        $set: { status: QuizStatus.COMPLETED },
      }
    );

    if (liveToCompleted.modifiedCount > 0) {
      console.log(`[QuizStatusUpdater] Transitioned ${liveToCompleted.modifiedCount} quizzes from LIVE to COMPLETED.`);
    }
  } catch (error) {
    console.error('[QuizStatusUpdater] Error updating quiz statuses:', error);
  }
};
