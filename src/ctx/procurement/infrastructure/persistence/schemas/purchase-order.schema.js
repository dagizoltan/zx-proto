import { z } from 'zod';
export const PurchaseOrderSchema = z.object({
  id: z.string().uuid(),
  supplierId: z.string().uuid(),
  status: z.enum(['DRAFT', 'ISSUED', 'RECEIVED', 'CANCELLED']).default('DRAFT'),
  items: z.array(z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
      unitCost: z.number().nonnegative().optional()
  })),
  totalCost: z.number().nonnegative().optional(),
  issuedAt: z.string().datetime().optional(),
  receivedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  code: z.string().min(1),
  expectedDate: z.string().datetime().optional(),
  notes: z.string().optional()
});
