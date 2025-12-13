import { z } from 'zod';

export const OrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  productName: z.string().optional()
});

export const OrderSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().optional(),
  customerId: z.string().uuid().optional(),
  items: z.array(OrderItemSchema),
  totalAmount: z.number().nonnegative(),
  status: z.enum(['CREATED', 'PAID', 'PARTIALLY_SHIPPED', 'SHIPPED', 'DELIVERED', 'CANCELLED']).default('CREATED'),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).default('PENDING'),
  shippingAddress: z.string().optional(),
  billingAddress: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});
