import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ethiosign';

async function startServer() {
  try {
    console.log(`[EthioSign Backend] Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('[EthioSign Backend] MongoDB connected successfully.');
  } catch (err) {
    console.warn('[EthioSign Backend] MongoDB connection failed or offline:', err.message);
    console.warn('[EthioSign Backend] Continuing without database connection. Some features will be limited.');
  }

  app.listen(PORT, () => {
    console.log(`[EthioSign Backend] Server running on http://localhost:${PORT}`);
  });
}

startServer();
