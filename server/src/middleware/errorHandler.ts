import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.issues,
    });
  }

  const isProd = process.env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: isProd ? 'Internal server error' : (err.message || 'Internal server error'),
  });
};
