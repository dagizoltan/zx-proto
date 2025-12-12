import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { MessageSchema } from '../../domain/schemas/communication.schema.js';

export const createSendMessage = ({ conversationRepository, messageRepository, eventBus }) => {
    return async (tenantId, input) => {
        const { conversationId, ...msgData } = input;

        // Ensure conversation exists or create it?
        // For now assume it exists or is passed.

        const message = {
            id: crypto.randomUUID(),
            tenantId,
            conversationId,
            ...msgData,
            createdAt: new Date().toISOString(),
            read: false
        };

        const validated = MessageSchema.safeParse(message);
        if (!validated.success) return Err(validated.error);

        const res = await messageRepository.save(tenantId, validated.data);
        if (isErr(res)) return res;

        // Update conversation timestamp
        const convRes = await conversationRepository.findById(tenantId, conversationId);
        if (!isErr(convRes) && convRes.value) {
            const updated = { ...convRes.value, updatedAt: new Date().toISOString() };
            await conversationRepository.save(tenantId, updated);
        }

        if (eventBus) {
            await eventBus.publish('communication.message_sent', validated.data);
        }

        return Ok(validated.data);
    };
};
