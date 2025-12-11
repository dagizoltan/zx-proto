import { z } from 'zod';

export const BOMComponentSchema = z.object({
  productId: z.string().uuid(), // Component SKU
  quantity: z.number().positive(),
  unit: z.string().optional()
});

export const BOMSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(), // Finished Good
  name: z.string().min(1),
  version: z.string().default('1.0'),
  components: z.array(BOMComponentSchema),
  laborCost: z.number().nonnegative().default(0),
  instructions: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('DRAFT'),
  createdAt: z.string().datetime().optional()
});

export const WorkOrderSchema = z.object({
    id: z.string().uuid(),
    bomId: z.string().uuid(),
    quantity: z.number().positive(), // Quantity to produce
    status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PLANNED'),
    startDate: z.string().datetime().optional(),
    completionDate: z.string().datetime().optional(),
    assignedTo: z.string().optional()
});
