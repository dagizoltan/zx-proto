import { z } from 'zod';
import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createCreateCategory = ({ categoryRepository }) => {
  const schema = z.object({
    name: z.string().min(1),
    parentId: z.string().optional().nullable(),
    description: z.string().optional()
  });

  const execute = async (tenantId, data) => {
    const parseResult = schema.safeParse(data);
    if (!parseResult.success) {
        return Err({ code: 'VALIDATION_ERROR', issues: parseResult.error.issues });
    }
    const validated = parseResult.data;

    const category = {
      id: crypto.randomUUID(),
      tenantId,
      ...validated,
      createdAt: new Date().toISOString()
    };

    // save returns Result now
    return categoryRepository.save(tenantId, category);
  };

  return { execute };
};
