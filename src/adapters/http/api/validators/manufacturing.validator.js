import { z } from 'zod';

export const createBOMSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1),
  components: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive()
  })).min(1),
  instructions: z.string().optional()
});

export const createWorkOrderSchema = z.object({
  bomId: z.string().uuid(),
  quantity: z.number().int().positive(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM')
});
