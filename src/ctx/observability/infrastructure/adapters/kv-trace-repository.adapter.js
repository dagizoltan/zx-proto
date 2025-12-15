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
            useIndexing((trace) => {
                const indexes = [];
                if (trace.timestamp) {
                    indexes.push({ key: ['traces_by_date', trace.timestamp], value: trace.id });
                }
                if (trace.traceId) {
                    indexes.push({ key: ['traces_by_id', trace.traceId], value: trace.id });
                }
                return indexes;
            })
        ]
    );
};
