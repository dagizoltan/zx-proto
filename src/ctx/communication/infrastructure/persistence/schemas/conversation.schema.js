import { z } from 'zod';

export const ConversationSchema = z.object({
  id: z.string(),
  tenantId: z.string().optional(),
  participantIds: z.array(z.string()).default([]),
  lastMessagePreview: z.string().optional(),
  updatedAt: z.string()
});
