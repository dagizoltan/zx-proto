import { createRepository } from '../../../../../lib/trust/repo.js';
import { useSchema } from '../../../../../lib/trust/middleware/schema.js';
import { useIndexing } from '../../../../../lib/trust/middleware/indexing.js';
import { FeedItemSchema } from '../../../../ctx/communication/domain/schemas/communication.schema.js';

export const createKVFeedRepository = (kv) => {
    return createRepository(
        kv,
        'feed',
        [
            useSchema(FeedItemSchema),
            useIndexing((item) => {
                const indexes = [];
                if (item.createdAt) {
                    indexes.push({ key: ['feed_by_date', item.createdAt], value: item.id });
                }
                if (item.channelId) {
                    indexes.push({ key: ['feed_by_channel', item.channelId], value: item.id });
                }
                return indexes;
            })
        ]
    );
};
