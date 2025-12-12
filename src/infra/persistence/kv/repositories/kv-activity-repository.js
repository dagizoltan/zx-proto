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

export const createKVActivityRepository = (kvPool) => {
    // Activity logs are just logs with level='activity'?
    // Or separate entity? Legacy used 'logs' with prefix.
    // Let's make it a separate repo 'activity_logs' to be clean.
    return createRepository(kvPool, 'activity_logs', [
        useSchema(LogSchema),
        useIndexing({
            'timestamp_desc': (l) => l.timestamp
        })
    ]);
};
