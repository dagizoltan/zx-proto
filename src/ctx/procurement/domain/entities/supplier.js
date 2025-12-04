import { z } from 'zod';

export const SupplierSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  name: z.string().min(1),
  code: z.string().min(1), // e.g. SUP-001
  contactName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  currency: z.string().default('USD'),
  paymentTerms: z.string().optional(), // e.g. Net30
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const PurchaseOrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  unitCost: z.number().nonnegative(),
  receivedQuantity: z.number().nonnegative().default(0),
});

export const PurchaseOrderSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  supplierId: z.string().uuid(),
  code: z.string().min(1), // e.g. PO-2023-001
  status: z.enum(['DRAFT', 'ISSUED', 'PARTIAL', 'RECEIVED', 'CANCELLED']).default('DRAFT'),
  items: z.array(PurchaseOrderItemSchema),
  expectedDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  totalCost: z.number().nonnegative().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createSupplier = (data) => SupplierSchema.parse({
  ...data,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export const createPurchaseOrder = (data) => PurchaseOrderSchema.parse({
  ...data,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});
