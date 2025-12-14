import { createKVLogRepository } from './infrastructure/adapters/kv-log-repository.adapter.js';
import { createKVActivityRepository } from './infrastructure/adapters/kv-activity-repository.adapter.js';
import { createKVAuditRepository } from './infrastructure/adapters/kv-audit-repository.adapter.js';
import { createListLogs } from './application/use-cases/list-logs.js';
import { createListActivityLogs } from './application/use-cases/list-activity-logs.js';
import { createListAuditLogs } from './application/use-cases/list-audit-logs.js';

/**
 * Observability Context Factory
 *
 * @param {Object} deps - Explicit DI
 * @param {Object} deps.kvPool
 */
export const createObservabilityContext = ({ kvPool }) => {

    const logRepo = createKVLogRepository(kvPool);
    const activityRepo = createKVActivityRepository(kvPool);
    const auditRepo = createKVAuditRepository(kvPool);

    return {
        repositories: {
            logs: logRepo,
            activity: activityRepo,
            audit: auditRepo
        },
        useCases: {
            listLogs: createListLogs({ logRepository: logRepo }),
            listActivityLogs: createListActivityLogs({ activityRepository: activityRepo }),
            listAuditLogs: createListAuditLogs({ auditRepository: auditRepo })
        }
    };
};
