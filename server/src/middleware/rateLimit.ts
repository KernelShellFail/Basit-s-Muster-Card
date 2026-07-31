import { Request, Response, NextFunction } from 'express';

// Simple in-memory sliding-window rate limiter.
// Good enough for a single-instance deployment; swap for Redis in multi-instance setups.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export const rateLimit = (opts: { windowMs: number; max: number; message?: string }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > opts.max) {
      return res.status(429).json({
        success: false,
        error: opts.message || 'Too many requests. Please try again later.',
      });
    }

    next();
  };
};

// Prevent unbounded memory growth by periodically sweeping expired buckets
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000).unref();
