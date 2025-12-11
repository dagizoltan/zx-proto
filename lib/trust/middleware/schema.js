import { Ok, Err } from '../result.js';

export const useSchema = (schema) => {
  return {
    name: 'schema',
    beforeSave: async (ctx, data) => {
      const parseResult = schema.safeParse(data);
      if (!parseResult.success) {
        return Err({
            code: 'VALIDATION_ERROR',
            issues: parseResult.error.issues
        });
      }
      return Ok(parseResult.data);
    }
  };
};
