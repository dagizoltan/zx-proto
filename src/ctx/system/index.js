// Refactored System Context
// Notifications moved to Communication
// Audit moved to Observability
import { createCleanupAuditLogsUseCase } from './application/use-cases/cleanup-audit-logs.js';

export const createSystemContext = (deps) => {
  // const kvPool = deps.persistence.kvPool;

  // We mock repository for now as Audit Logs are in Observability
  const cleanupAuditLogs = createCleanupAuditLogsUseCase({});

  return {
    repositories: {},
    useCases: {
      cleanupAuditLogs
    }
  };
};
