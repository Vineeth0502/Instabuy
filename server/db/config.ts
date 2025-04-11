import mongoose from 'mongoose';
import 'dotenv/config'; // Load environment variables from .env

// MongoDB Connection URI from .env
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error('❌ MONGO_URI is not defined in environment variables');
}

// MongoDB Connection Options (deprecated options removed)
const options = {} as mongoose.ConnectOptions;

// Connect to MongoDB
export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI, options);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Disconnect from MongoDB
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('🛑 MongoDB disconnected successfully');
  } catch (error) {
    console.error('❌ MongoDB disconnection error:', error);
  }
};