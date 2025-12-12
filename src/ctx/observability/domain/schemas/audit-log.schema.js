import { z } from 'zod';

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  userId: z.string().optional(),
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().optional(),
  details: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  timestamp: z.string().datetime(),
});
