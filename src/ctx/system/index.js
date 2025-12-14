// Refactored System Context
// Notifications moved to Communication
// Audit moved to Observability
import { createCleanupAuditLogsUseCase } from './application/use-cases/cleanup-audit-logs.js';
import { resolveDependencies } from '../../utils/registry/dependency-resolver.js';
import { createContextBuilder } from '../../utils/registry/context-builder.js';

export const createSystemContext = async (deps) => {
  const { kvPool, messaging } = resolveDependencies(deps, {
    kvPool: ['persistence.kvPool', 'kvPool'],
    messaging: ['infra.messaging', 'messaging']
  });

  // We mock repository for now as Audit Logs are in Observability
  const cleanupAuditLogs = createCleanupAuditLogsUseCase({});

  return createContextBuilder('system')
    .withUseCases({
      cleanupAuditLogs
    })
    .build();
};

export const SystemContext = {
    name: 'system',
    dependencies: ['infra.persistence', 'infra.messaging'],
    factory: createSystemContext
};
