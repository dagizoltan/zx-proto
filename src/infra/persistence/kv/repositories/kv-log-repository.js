import { createRepository, useSchema, useIndexing } from '../../../../../lib/trust/index.js';
import { z } from 'zod';

// We need a schema for generic logs if we use Trust Repo
const LogSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string(),
    level: z.string(),
    message: z.string(),
    timestamp: z.string().datetime(),
    context: z.record(z.any()).optional()
});

export const createKVLogRepository = (kvPool) => {
    return createRepository(kvPool, 'logs', [
        useSchema(LogSchema),
        useIndexing({
            'level': (l) => l.level.toLowerCase(),
            'timestamp_desc': (l) => l.timestamp
        })
    ]);
};
