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

export const ConversationSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string(),
    participantIds: z.array(z.string()),
    lastMessagePreview: z.string().optional(),
    updatedAt: z.string().datetime()
});

export const MessageSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string(),
    conversationId: z.string().uuid(),
    senderId: z.string(),
    content: z.string(),
    createdAt: z.string().datetime()
});
