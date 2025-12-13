import { z } from 'zod';
export const MessageSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string(),
    conversationId: z.string().uuid(),
    senderId: z.string(),
    content: z.string(),
    createdAt: z.string().datetime()
});
