import { z } from 'zod';

export const FeedItemSchema = z.object({
  id: z.string(),
  tenantId: z.string().optional(),
  channelId: z.string(),
  content: z.string(),
  authorId: z.string().optional(),
  type: z.enum(['post', 'comment', 'system']).default('post'),
  createdAt: z.string()
});
