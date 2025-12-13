import { z } from 'zod';

export const PriceRuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  priority: z.number().int().default(0),
  conditions: z.object({
    minQuantity: z.number().int().optional(),
    customerGroup: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }).optional(),
  actions: z.object({
    type: z.enum(['PERCENTAGE_OFF', 'FIXED_AMOUNT_OFF', 'FIXED_PRICE']),
    value: z.number().nonnegative(),
  }),
});

export const ProductSchema = z.object({
  id: z.string().uuid(),
  // tenantId is usually handled by repository context, but might be present in object for completeness if needed.
  // The original schema had commented out tenantId, keeping it consistent.
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),

  price: z.number().positive(),
  priceRules: z.array(PriceRuleSchema).optional().default([]),

  type: z.enum(['SIMPLE', 'CONFIGURABLE', 'VARIANT']).default('SIMPLE'),
  parentId: z.string().uuid().optional(),
  variantAttributes: z.any().optional(),
  configurableAttributes: z.array(z.string()).optional(),

  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT']).default('ACTIVE'),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
