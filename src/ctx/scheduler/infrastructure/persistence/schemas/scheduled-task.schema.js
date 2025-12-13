import { z } from 'zod';
export const ScheduledTaskSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string(),
    handlerKey: z.string(),
    cronExpression: z.string(),
    enabled: z.boolean().default(true),
    lastRunAt: z.string().datetime().optional().nullable(),
    createdAt: z.string().datetime().optional()
});
