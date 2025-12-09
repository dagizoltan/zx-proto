import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contactName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional()
});

export const createPOSchema = z.object({
  supplierId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    unitCost: z.number().positive().optional()
  })).min(1),
  expectedDate: z.string().datetime().optional()
});
