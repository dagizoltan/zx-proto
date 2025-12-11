import { z } from 'zod';

export const ProductTrustSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  sku: z.string().min(3),
  name: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().nonnegative(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  // Add sensitive field for testing encryption
  costPrice: z.number().optional(),
}).describe('product');

export const ProductTrustConfig = {
  fields: {
    costPrice: { encrypted: true } // Competitor sensitive info
  }
};
