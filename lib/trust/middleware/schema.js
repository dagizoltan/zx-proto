import { Result, Errors } from '../types.js';

/**
 * Schema Validation Middleware
 * Adapts Zod schemas to the Trust Pipeline
 */
export const useSchema = (zodSchema) => (next) => async (ctx, data) => {
  // Attach schema meta to context for Repo use
  ctx.schema = { name: zodSchema.description || 'entity' };

  if (ctx.operation === 'save') {
    const parseResult = zodSchema.safeParse(data);
    if (!parseResult.success) {
      return Result.fail(Errors.Validation(parseResult.error.message));
    }
    // Proceed with validated/transformed data
    return next(ctx, parseResult.data);
  }

  // Pass-through for 'find' (query validation is different)
  return next(ctx, data);
};
