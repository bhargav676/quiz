import cron from 'node-cron';
import { updateQuizStatuses } from '../utils/quizStatusUpdater';

export const initJobs = (): void => {
  console.log('⏰ [Cron Jobs] Initializing background cron jobs...');

  // Run the quiz status updater every minute
  cron.schedule('* * * * *', async () => {
    await updateQuizStatuses();
  });
};
