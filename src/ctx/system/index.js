import { createKVNotificationRepository } from '../../infra/persistence/kv/repositories/kv-notification-repository.js';
import { createKVAuditRepository } from '../../infra/persistence/kv/repositories/kv-audit-repository.js';
import { createNotificationService } from './domain/services/notification-service.js';

export const createSystemContext = (deps) => {
  const kv = deps.persistence.kv;

  // Repositories
  const notificationRepo = createKVNotificationRepository(kv);
  const auditRepo = createKVAuditRepository(kv);

  // Services
  const notificationService = createNotificationService({ notificationRepo });

  return {
    repositories: {
      notification: notificationRepo,
      audit: auditRepo
    },
    useCases: {
      // Expose service methods directly as use cases for simplicity in this domain
      // or wrap them if strictly following Clean Architecture.
      // For now, exposing the service is cleaner for "System" utilities.
      notifications: notificationService
    }
  };
};
