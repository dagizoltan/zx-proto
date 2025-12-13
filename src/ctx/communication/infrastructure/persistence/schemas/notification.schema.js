import { z } from 'zod';

export const NotificationSchema = z.object({
  id: z.string(),
  tenantId: z.string().optional(),
  userId: z.string(),
  title: z.string(),
  message: z.string().optional(),
  level: z.enum(['info', 'warning', 'error', 'success']).default('info'),
  link: z.string().optional(),
  read: z.boolean().default(false),
  createdAt: z.string()
});
