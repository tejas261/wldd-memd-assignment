import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, isDuplicate } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: error.issues[0]?.message ?? 'Invalid input',
        details: error.flatten(),
      },
    });
    return;
  }
  if (error instanceof AppError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  if (isDuplicate(error)) {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'This record already exists.' } });
    return;
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.too.large'
  ) {
    res.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body must be smaller than 16 KB.' },
    });
    return;
  }
  if (error instanceof SyntaxError && 'body' in error) {
    res
      .status(400)
      .json({ error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } });
    return;
  }
  // Do not log request bodies, tokens, or database connection strings.
  logger.error(
    {
      method: req.method,
      path: req.path,
      errorType: error instanceof Error ? error.name : 'UnknownError',
    },
    'request failed',
  );
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
  });
};
