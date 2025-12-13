import { z } from 'zod';
export const ConversationSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string(),
    participantIds: z.array(z.string()),
    lastMessagePreview: z.string().optional(),
    updatedAt: z.string().datetime()
});
