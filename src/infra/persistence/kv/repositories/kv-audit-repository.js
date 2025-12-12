import { createRepository, useSchema, useIndexing } from '../../../../../lib/trust/index.js';
import { AuditLogSchema } from '../../../../ctx/observability/domain/schemas/observability.schema.js';

export const createKVAuditRepository = (kvPool) => {
    return createRepository(kvPool, 'audit_logs', [
        useSchema(AuditLogSchema),
        useIndexing({
            'user': (l) => l.userId,
            'resource': (l) => l.resource,
            'timestamp_desc': (l) => l.timestamp
        })
    ]);
};
