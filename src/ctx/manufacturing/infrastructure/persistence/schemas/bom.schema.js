import { z } from 'zod';
export const BOMComponentSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  unit: z.string().optional()
});
export const BOMSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  name: z.string().min(1),
  version: z.string().default('1.0'),
  components: z.array(BOMComponentSchema),
  laborCost: z.number().nonnegative().default(0),
  instructions: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('DRAFT'),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});
