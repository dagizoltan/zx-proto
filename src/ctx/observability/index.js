import { createKVLogRepository } from './infrastructure/adapters/kv-log-repository.adapter.js';
import { createKVActivityRepository } from './infrastructure/adapters/kv-activity-repository.adapter.js';
import { createKVAuditRepository } from './infrastructure/adapters/kv-audit-repository.adapter.js';
import { createListLogs } from './application/use-cases/list-logs.js';
import { createListActivityLogs } from './application/use-cases/list-activity-logs.js';
import { createListAuditLogs } from './application/use-cases/list-audit-logs.js';
import { resolveDependencies } from '../../utils/registry/dependency-resolver.js';
import { createContextBuilder } from '../../utils/registry/context-builder.js';

export const createObservabilityContext = async (deps) => {
    const { kvPool } = resolveDependencies(deps, {
        kvPool: ['persistence.kvPool', 'kvPool']
    });

    const logRepo = createKVLogRepository(kvPool);
    const activityRepo = createKVActivityRepository(kvPool);
    const auditRepo = createKVAuditRepository(kvPool);

    return createContextBuilder('observability')
        .withRepositories({
            audit: auditRepo,
            logs: logRepo,
            activity: activityRepo,
        })
        .withUseCases({
            listLogs: createListLogs({ logRepository: logRepo }),
            listActivityLogs: createListActivityLogs({ activityRepository: activityRepo }),
            listAuditLogs: createListAuditLogs({ auditRepository: auditRepo })
        })
        .build();
};

export const ObservabilityContext = {
    name: 'observability',
    dependencies: ['infra.persistence'],
    factory: createObservabilityContext
};
