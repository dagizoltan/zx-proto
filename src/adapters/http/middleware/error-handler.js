import { AppError } from '../../../utils/errors.js';
import { ZodError } from 'zod';

export const errorHandler = (err, c) => {
  console.error(err);

  if (err instanceof AppError) {
    return c.json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      }
    }, err.statusCode);
  }

  if (err instanceof ZodError) {
    return c.json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors,
      }
    }, 400);
  }

  return c.json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    }
  }, 500);
};
