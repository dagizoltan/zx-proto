import { createRepository, useSchema, useIndexing } from '../../../../../lib/trust/index.js';
import { FeedItemSchema } from '../../../../ctx/communication/domain/schemas/communication.schema.js';

export const createKVFeedRepository = (kvPool) => {
    return createRepository(kvPool, 'feed', [
        useSchema(FeedItemSchema),
        useIndexing({
            'channel': (f) => f.channelId,
            'timestamp_desc': (f) => f.createdAt
        })
    ]);
};
