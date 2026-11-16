import path from 'node:path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { app, PORT } from './app';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const mongoUri = process.env.MONGODB_URI ?? 'mongodb://admin:password123@localhost:27018/cexexchange?authSource=admin';

const connectToDatabase = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

void connectToDatabase();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});