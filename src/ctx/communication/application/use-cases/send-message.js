import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { createMessage } from '../../domain/entities/message.js';

export const createSendMessage = ({ conversationRepository, messageRepository, eventBus }) => {
    return async (tenantId, input) => {
        const { conversationId, ...msgData } = input;

        let message;
        try {
            message = createMessage({
                id: crypto.randomUUID(),
                tenantId,
                conversationId,
                ...msgData,
                createdAt: new Date().toISOString()
                // read: false // Removed from entity schema/factory earlier? Let's check.
                // MessageSchema in step 4 didn't have 'read'.
            });
        } catch (e) {
            return Err({ code: 'VALIDATION_ERROR', message: e.message });
        }

        const res = await messageRepository.save(tenantId, message);
        if (isErr(res)) return res;

        // Update conversation timestamp
        const convRes = await conversationRepository.findById(tenantId, conversationId);
        if (!isErr(convRes) && convRes.value) {
            // Assume conversation entity is pure object now.
            // Ideally should use factory or update method if exists, but spread is fine for data.
            const updated = { ...convRes.value, updatedAt: new Date().toISOString() };
            await conversationRepository.save(tenantId, updated);
        }

        if (eventBus) {
            await eventBus.publish('communication.message_sent', message);
        }

        return Ok(message);
    };
};
