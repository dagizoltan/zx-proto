import { z } from 'zod';
export const WorkOrderSchema = z.object({
    id: z.string().uuid(),
    bomId: z.string().uuid(),
    quantity: z.number().positive(),
    status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PLANNED'),
    startDate: z.string().datetime().optional(),
    completionDate: z.string().datetime().optional(),
    assignedTo: z.string().optional()
});
