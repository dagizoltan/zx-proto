import { createKVLogRepository, createKVActivityRepository, createKVAuditRepository } from './domain/repositories/kv-log-repositories.js';
import { createListLogs } from './application/use-cases/list-logs.js';
import { createListActivityLogs } from './application/use-cases/list-activity-logs.js';
import { createListAuditLogs } from './application/use-cases/list-audit-logs.js';

export const createObservabilityContext = (deps) => {
    const kvPool = deps.persistence.kvPool;

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
