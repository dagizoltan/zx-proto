import { createRepository } from '../../../../../lib/trust/repo.js';
import { useSchema } from '../../../../../lib/trust/middleware/schema.js';
import { useIndexing } from '../../../../../lib/trust/middleware/indexing.js';
import { MetricSchema } from '../persistence/schemas/obs.schemas.js';

export const createKVMetricRepository = (kv) => {
    return createRepository(
        kv,
        'metrics',
        [
            useSchema(MetricSchema),
            useIndexing({
                'timestamp': (metric) => metric.timestamp,
                'name': (metric) => metric.name
            })
        ]
    );
};
