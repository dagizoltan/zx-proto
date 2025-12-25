import { createEventBus } from './kv-queue/kv-event-bus.js';
import { createOutboxWorker } from './worker/outbox-worker.js';
import { resolveDependencies } from '../../utils/registry/dependency-resolver.js';

export const createMessagingContext = async (deps) => {
  const { kvPool } = resolveDependencies(deps, {
    kvPool: ['persistence.kvPool', 'kvPool']
  });

  const eventBus = createEventBus(kvPool);

  // Start the Legacy Listener (for non-domain events if any)
  await eventBus.startListening();

  // Start the Domain Event Outbox Worker (Centralized)
  const outboxWorker = createOutboxWorker(kvPool, eventBus);
  await outboxWorker.start();

  return {
    eventBus,
    outboxWorker
  };
};

export const MessagingContext = {
    name: 'infra.messaging',
    dependencies: ['infra.persistence'],
    factory: createMessagingContext
};
