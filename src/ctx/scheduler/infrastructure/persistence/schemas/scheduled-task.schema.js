import { z } from 'zod';

export const ScheduledTaskSchema = z.object({
  id: z.string(),
  tenantId: z.string().optional(),
  handlerKey: z.string(),
  name: z.string(),
  description: z.string().optional(),
  schedule: z.string(), // cron expression
  enabled: z.boolean().default(true),
  lastRunAt: z.string().nullable().optional(),
  nextRunAt: z.string().nullable().optional(),
  status: z.enum(['IDLE', 'RUNNING', 'ERROR']).default('IDLE'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});
