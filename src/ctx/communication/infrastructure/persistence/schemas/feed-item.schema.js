import { z } from 'zod';
export const FeedItemSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string(),
    channelId: z.string(),
    content: z.string(),
    authorId: z.string().optional(),
    createdAt: z.string().datetime(),
    type: z.enum(['post', 'system']).default('post')
});
