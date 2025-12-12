import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { FeedItemSchema } from '../../domain/schemas/communication.schema.js';

export const createPostFeedItem = ({ feedRepository, eventBus }) => {
    return async (tenantId, input) => {
        const item = {
            id: crypto.randomUUID(),
            tenantId,
            ...input,
            createdAt: new Date().toISOString()
        };

        const validated = FeedItemSchema.safeParse(item);
        if (!validated.success) return Err(validated.error);

        const res = await feedRepository.save(tenantId, validated.data);
        if (isErr(res)) return res;

        if (eventBus) {
            await eventBus.publish('communication.feed_posted', validated.data);
        }

        return Ok(validated.data);
    };
};
