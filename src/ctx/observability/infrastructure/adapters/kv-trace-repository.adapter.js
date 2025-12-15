import { createRepository } from '../../../../../lib/trust/repo.js';
import { useSchema } from '../../../../../lib/trust/middleware/schema.js';
import { useIndexing } from '../../../../../lib/trust/middleware/indexing.js';
import { TraceSchema } from '../persistence/schemas/obs.schemas.js';

export const createKVTraceRepository = (kv) => {
    return createRepository(
        kv,
        'traces',
        [
            useSchema(TraceSchema),
            useIndexing({
                'timestamp': (trace) => trace.timestamp,
                'traceId': (trace) => trace.traceId
            })
        ]
    );
};
