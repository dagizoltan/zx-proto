import { z } from 'zod';

export const BOMComponentSchema = z.object({
  productId: z.string().uuid(), // Raw Material
  quantity: z.number().positive(),
  notes: z.string().optional(),
});

export const BillOfMaterialsSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  productId: z.string().uuid(), // Finished Good
  name: z.string().min(1),
  components: z.array(BOMComponentSchema),
  laborCost: z.number().nonnegative().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const WorkOrderSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  code: z.string().min(1),
  bomId: z.string().uuid(),
  quantity: z.number().positive(), // How many finished goods to make
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PLANNED'),
  startDate: z.string().datetime().optional(),
  completionDate: z.string().datetime().optional(),
  assignedTo: z.string().optional(), // UserId
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createBOM = (data) => BillOfMaterialsSchema.parse({
  ...data,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export const createWorkOrder = (data) => WorkOrderSchema.parse({
  ...data,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});
