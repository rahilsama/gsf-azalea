import type { NextFunction, Request, Response } from 'express';

interface ApiError extends Error {
  statusCode?: number;
  details?: unknown;
}

// Not found handler
export const notFoundHandler = (req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
  });
};

// Centralized error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: ApiError, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500;

  // Basic logging; in real production you might integrate with a logging platform
  // eslint-disable-next-line no-console
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`, {
    statusCode,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    details: err.details,
  });

  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    ...(err.details ? { details: err.details } : {}),
  });
};

