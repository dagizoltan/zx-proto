import { z } from 'zod';

export const TaskExecutionSchema = z.object({
  id: z.string(),
  tenantId: z.string().optional(),
  taskId: z.string(),
  handlerKey: z.string(),
  startedAt: z.string(),
  completedAt: z.string().nullable().optional(),
  status: z.enum(['RUNNING', 'SUCCESS', 'FAILED']),
  result: z.any().optional(),
  error: z.string().nullable().optional(),
  durationMs: z.number().nullable().optional()
});
