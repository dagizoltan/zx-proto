import { z } from 'zod';

export const createCreateCategory = ({ categoryRepository }) => {
  const schema = z.object({
    name: z.string().min(1),
    parentId: z.string().optional().nullable(),
    description: z.string().optional()
  });

  const execute = async (tenantId, data) => {
    const validated = schema.parse(data);

    const category = {
      id: crypto.randomUUID(),
      tenantId,
      ...validated,
      createdAt: new Date().toISOString()
    };

    return categoryRepository.save(tenantId, category);
  };

  return { execute };
};
