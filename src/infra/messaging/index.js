import { createEventBus } from './kv-queue/kv-event-bus.js';
import { resolveDependencies } from '../../utils/registry/dependency-resolver.js';

export const createMessagingContext = async (deps) => {
  const { kvPool } = resolveDependencies(deps, {
    kvPool: ['persistence.kvPool', 'kvPool']
  });

  const eventBus = createEventBus(kvPool);
  await eventBus.startListening();

  return {
    eventBus
  };
};

export const MessagingContext = {
    name: 'infra.messaging',
    dependencies: ['infra.persistence'],
    factory: createMessagingContext
};
