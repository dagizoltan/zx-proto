import { z } from 'zod';
export const NotificationSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string(),
    userId: z.string(),
    title: z.string(),
    message: z.string(),
    level: z.enum(['SUCCESS', 'INFO', 'WARN', 'ERROR']),
    link: z.string().optional(),
    read: z.boolean().default(false),
    createdAt: z.string().datetime()
});
