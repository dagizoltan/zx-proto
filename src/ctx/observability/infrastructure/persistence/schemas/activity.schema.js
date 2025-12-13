import { z } from 'zod';

export const ActivitySchema = z.object({
  id: z.string(),
  tenantId: z.string().optional(),
  userId: z.string(),
  action: z.string(),
  resource: z.string().optional(),
  resourceId: z.string().optional(),
  meta: z.record(z.any()).optional(),
  timestamp: z.string()
});
