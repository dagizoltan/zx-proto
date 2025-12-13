import { z } from 'zod';

export const LogSchema = z.object({
  id: z.string(),
  tenantId: z.string().optional(),
  service: z.string().default('system'),
  level: z.enum(['INFO', 'WARN', 'ERROR', 'DEBUG']),
  message: z.string(),
  meta: z.record(z.any()).optional(),
  timestamp: z.string()
});
