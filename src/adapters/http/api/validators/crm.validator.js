import { z } from 'zod';

export const listCustomersQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  cursor: z.string().optional(),
  q: z.string().optional(),
  search: z.string().optional()
});
