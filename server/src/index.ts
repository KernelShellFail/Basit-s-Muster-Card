import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes';
import { initSchema } from './schemas/dbInit';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '20mb' })); // Allow signature Base64 data URLs
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Initialize tables on startup
initSchema();

// Mount modern decomposed modular routing system
app.use('/api', apiRouter);

// Global Error Handler Middleware
app.use(errorHandler);

// Process Exception Handlers for Production Stability
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception thrown:', error);
  // Optional: Graceful shutdown logic if needed in production
});

app.listen(PORT, () => {
  console.log(`MusterMate Modern Express server running on port ${PORT}`);
});
export default app;
