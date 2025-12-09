import { ZodError } from 'zod';

/**
 * Validation Middleware Factory
 *
 * Validates request body against Zod schema
 */
export const validateRequest = (schema) => {
  return async (c, next) => {
    try {
      const body = await c.req.json();
      const validated = schema.parse(body);

      // Attach validated data to context
      c.set('validatedData', validated);

      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        return c.json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }, 400);
      }
      throw error;
    }
  };
};

/**
 * Query Parameter Validation
 */
export const validateQuery = (schema) => {
  return async (c, next) => {
    try {
      const query = Object.fromEntries(
        new URLSearchParams(c.req.url.split('?')[1] || '')
      );
      const validated = schema.parse(query);
      c.set('validatedQuery', validated);
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        return c.json({
          success: false,
          error: 'Invalid query parameters',
          details: error.errors
        }, 400);
      }
      throw error;
    }
  };
};
