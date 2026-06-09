import mongoose from 'mongoose';
import { env } from './env';
import { User } from '../models/User';
import { Role } from '../types/enums';

async function seedAdminUser(): Promise<void> {
  try {
    const adminExists = await User.findOne({ role: Role.ADMIN });
    if (!adminExists) {
      const defaultAdmin = new User({
        name: 'Default Admin',
        email: 'admin@quizarena.com',
        password: 'admin123',
        role: Role.ADMIN,
        isActive: true,
      });
      await defaultAdmin.save();
      console.log(`👤 Default Admin Account Created: admin@quizarena.com (password: admin123)`);
    }
  } catch (error) {
    console.error('❌ Failed to seed default admin user:', error);
  }
}

export async function connectDatabase(): Promise<void> {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Seed admin if necessary
    await seedAdminUser();
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});
