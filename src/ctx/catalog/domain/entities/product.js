import { z } from 'zod';

export const PriceRuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  priority: z.number().int().default(0),
  conditions: z.object({
    minQuantity: z.number().int().optional(),
    customerGroup: z.string().optional(), // e.g., 'WHOLESALE', 'VIP'
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
  tenantId: z.string(),
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),

  // Enterprise Pricing
  price: z.number().positive(), // Base price
  priceRules: z.array(PriceRuleSchema).optional().default([]),

  // Enterprise Variants
  type: z.enum(['SIMPLE', 'CONFIGURABLE', 'VARIANT']).default('SIMPLE'),
  parentId: z.string().uuid().optional(), // If VARIANT, points to CONFIGURABLE
  variantAttributes: z.any().optional(), // e.g. { size: 'L', color: 'Red' } - z.record caused Zod v4 issue
  configurableAttributes: z.array(z.string()).optional(), // e.g. ['size', 'color'] for CONFIGURABLE

  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT']).default('ACTIVE'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createProduct = (data) => ProductSchema.parse(data);
