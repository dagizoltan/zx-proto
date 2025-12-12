import { createRepository } from '../../../../../lib/trust/repo.js';
import { useSchema } from '../../../../../lib/trust/middleware/schema.js';
import { useIndexing } from '../../../../../lib/trust/middleware/indexing.js';
import { MetricSchema } from './schemas/obs.schemas.js';

export const createKVMetricRepository = (kv) => {
    return createRepository(
        kv,
        'metrics',
        [
            useSchema(MetricSchema),
            useIndexing((metric) => {
                const indexes = [];
                if (metric.timestamp) {
                    indexes.push({ key: ['metrics_by_date', metric.timestamp], value: metric.id });
                }
                if (metric.name) {
                    indexes.push({ key: ['metrics_by_name', metric.name], value: metric.id });
                }
                return indexes;
            })
        ]
    );
};
