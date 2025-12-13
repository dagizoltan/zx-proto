import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { createMessage } from '../../domain/entities/message.js';
import { createConversation } from '../../domain/entities/conversation.js'; // Import Conversation Factory

export const createSendMessage = ({ conversationRepository, messageRepository, eventBus }) => {
    return async (tenantId, input) => {
        let { conversationId, from, to, content, ...rest } = input;

        // 1. Handle New Conversation (if no ID provided)
        if (!conversationId) {
             if (!to) {
                 return Err({ code: 'VALIDATION_ERROR', message: 'To (recipient) is required for new conversation' });
             }
             // Create Conversation
             conversationId = crypto.randomUUID();

             // Handle 'to' as single ID or Array
             const recipients = Array.isArray(to) ? to : [to];
             const participantIds = [...new Set([from, ...recipients])];

             try {
                 const newConv = createConversation({
                     id: conversationId,
                     tenantId,
                     participantIds,
                     lastMessagePreview: content.substring(0, 50),
                     updatedAt: new Date().toISOString()
                 });

                 const res = await conversationRepository.save(tenantId, newConv);
                 if (isErr(res)) return res;
             } catch (e) {
                 return Err({ code: 'VALIDATION_ERROR', message: 'Failed to create conversation: ' + e.message });
             }
        }

        // 2. Create Message
        let message;
        try {
            message = createMessage({
                id: crypto.randomUUID(),
                tenantId,
                conversationId,
                senderId: from, // Map 'from' to 'senderId' for Schema
                content,
                ...rest,
                createdAt: new Date().toISOString()
            });
        } catch (e) {
            return Err({ code: 'VALIDATION_ERROR', message: e.message });
        }

        // 3. Save Message
        const res = await messageRepository.save(tenantId, message);
        if (isErr(res)) return res;

        // 4. Update Conversation Timestamp & Preview (if existing)
        // If we just created it, it's already fresh. But safe to update again or optimize.
        // For existing, we MUST update.
        // Let's just update always for simplicity (upsert behavior usually).
        // But we need to fetch it first to preserve other fields if needed?
        // Conversation entity is simple.
        // Let's fetch to be safe.
        const convRes = await conversationRepository.findById(tenantId, conversationId);
        if (!isErr(convRes) && convRes.value) {
            const updated = {
                ...convRes.value,
                lastMessagePreview: content.substring(0, 50),
                updatedAt: new Date().toISOString()
            };
            await conversationRepository.save(tenantId, updated);
        }

        if (eventBus) {
            await eventBus.publish('communication.message_sent', message);
        }

        // Return message AND conversationId so caller knows the ID
        return Ok({ ...message, conversationId });
    };
};
