import { z } from 'zod';

export const CategorySchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    parentId: z.string().uuid().optional(),
    description: z.string().optional()
});
