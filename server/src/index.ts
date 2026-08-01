import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import apiRouter from './routes';
import { initSchema } from './schemas/dbInit';
import { errorHandler } from './middleware/errorHandler';
import { pool } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// In production the compiled server lives at server/dist/index.js; the built
// SPA is at the repository root dist/. tsx (dev) runs from server/src.
const currentDir = __dirname;
const distDir = isProduction
  ? path.resolve(currentDir, '..', '..', 'dist')
  : path.resolve(currentDir, '..', '..', 'dist');

// Restrict CORS to the configured frontend origin. In the single-server
// deployment the SPA is served from the same origin, so this only matters if
// a separate frontend origin is ever introduced.
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors({
  origin: corsOrigin ? corsOrigin.split(',').map(o => o.trim()) : false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Security headers (helmet). CSP is configured for same-origin serving so the
// SPA, its inline scripts and assets, plus data: URLs for signatures/photos work.
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  } : false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(express.json({ limit: '20mb' })); // Allow signature Base64 data URLs
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve the built SPA in production (single-server deployment).
if (isProduction && fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// Initialize tables on startup.
const startServer = async () => {
  try {
    await initSchema();
    // Mount modern decomposed modular routing system
    app.use('/api', apiRouter);

    // SPA fallback (after API routes so /api/* is never caught).
    if (isProduction && fs.existsSync(distDir)) {
      app.use((req, res, next) => {
        if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
    // Global Error Handler Middleware
    app.use(errorHandler);

    server = app.listen(PORT, () => {
      console.log(`MusterMate Modern Express server running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

// Process Exception Handlers for Production Stability
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception thrown:', error);
});

// Graceful shutdown: close the HTTP server and the pg pool.
let server: ReturnType<typeof app.listen> | null = null;
const shutdown = (signal: string) => {
  console.log(`${signal} received, shutting down gracefully...`);
  if (server) {
    server.close(() => {
      pool.end(() => process.exit(0));
    });
    // Force-exit if connections refuse to drain.
    setTimeout(() => process.exit(1), 10_000).unref();
  } else {
    process.exit(0);
  }
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
export default app;
