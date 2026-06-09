import { env, validateEnv, connectDatabase } from './config';
import app from './app';
import { initJobs } from './jobs';

async function startServer(): Promise<void> {
  try {
    // Validate environment variables
    validateEnv();

    // Connect to MongoDB
    await connectDatabase();

    // Initialize background jobs
    initJobs();

    // Start Express server
    app.listen(env.PORT, () => {
      console.log(`\n🚀 QuizArena Server started`);
      console.log(`   Environment : ${env.NODE_ENV}`);
      console.log(`   Port        : ${env.PORT}`);
      console.log(`   API URL     : http://localhost:${env.PORT}/api`);
      console.log(`   Health      : http://localhost:${env.PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
  console.error('❌ Unhandled Rejection:', reason.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

startServer(); 
