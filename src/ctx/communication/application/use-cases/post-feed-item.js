import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';
import { createFeedItem } from '../../domain/entities/feed-item.js';

export const createPostFeedItem = ({ feedRepository, eventBus }) => {
    return async (tenantId, input) => {
        let item;
        try {
            item = createFeedItem({
                id: crypto.randomUUID(),
                tenantId,
                ...input,
                createdAt: new Date().toISOString()
            });
        } catch (e) {
            return Err({ code: 'VALIDATION_ERROR', message: e.message });
        }

        const res = await feedRepository.save(tenantId, item);
        if (isErr(res)) return res;

        if (eventBus) {
            await eventBus.publish('communication.feed_posted', item);
        }

        return Ok(item);
    };
};
