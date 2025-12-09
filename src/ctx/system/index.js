import { createKVNotificationRepository } from '../../infra/persistence/kv/repositories/kv-notification-repository.js';
import { createKVAuditRepository } from '../../infra/persistence/kv/repositories/kv-audit-repository.js';
import { createNotificationService } from './domain/services/notification-service.js';
import { createSystemEventsListener } from './application/listeners/system-events-listener.js';
import { createListAuditLogs } from './application/use-cases/list-audit-logs.js';

export const createSystemContext = (deps) => {
  const kvPool = deps.persistence.kvPool;

  // Repositories
  const notificationRepo = createKVNotificationRepository(kvPool);
  const auditRepo = createKVAuditRepository(kvPool);

  // Services
  const notificationService = createNotificationService({ notificationRepo });

  // Event Listeners
  if (deps.messaging && deps.messaging.eventBus) {
      const listener = createSystemEventsListener({
          notificationService,
          eventBus: deps.messaging.eventBus
      });
      listener.setupSubscriptions();
  }

  return {
    repositories: {
      notification: notificationRepo,
      audit: auditRepo
    },
    useCases: {
      // Expose service methods directly as use cases for simplicity in this domain
      // or wrap them if strictly following Clean Architecture.
      // For now, exposing the service is cleaner for "System" utilities.
      notifications: notificationService,
      listAuditLogs: createListAuditLogs({ auditRepository: auditRepo })
    }
  };
};
