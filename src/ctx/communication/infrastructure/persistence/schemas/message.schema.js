import { z } from 'zod';

export const MessageSchema = z.object({
  id: z.string(),
  tenantId: z.string().optional(),
  conversationId: z.string(),
  senderId: z.string(),
  content: z.string(),
  createdAt: z.string()
});
