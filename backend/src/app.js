import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

// Routes
import signsRouter from './routes/signs.js';
import categoriesRouter from './routes/categories.js';
import conversationsRouter from './routes/conversations.js';
import feedbackRouter from './routes/feedback.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.json({
    status: 'healthy',
    service: 'EthioSign Backend API',
    version: '1.0.0',
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/signs', signsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/feedback', feedbackRouter);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('[Backend Error]', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

export default app;
