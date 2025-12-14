// Refactored System Context
// Notifications moved to Communication
// Audit moved to Observability
import { createCleanupAuditLogsUseCase } from './application/use-cases/cleanup-audit-logs.js';

/**
 * System Context Factory
 *
 * @param {Object} deps - Explicit DI
 * @param {Object} deps.kvPool
 * @param {Object} deps.messaging
 */
export const createSystemContext = ({ kvPool, messaging }) => {

  // We mock repository for now as Audit Logs are in Observability
  const cleanupAuditLogs = createCleanupAuditLogsUseCase({});

  return {
    repositories: {},
    useCases: {
      cleanupAuditLogs
    }
  };
};
