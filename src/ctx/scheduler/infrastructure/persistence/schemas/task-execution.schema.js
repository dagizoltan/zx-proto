import { z } from 'zod';
export const TaskExecutionSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string(),
    taskId: z.string(),
    handlerKey: z.string(),
    status: z.enum(['RUNNING', 'SUCCESS', 'FAILURE']),
    startedAt: z.string().datetime(),
    completedAt: z.string().datetime().optional().nullable(),
    durationMs: z.number().optional().nullable(),
    error: z.string().optional().nullable()
});
