import { createKVPool } from './kv/kv-connection-pool.js';
import { createCache } from './kv/kv-cache-adapter.js';
import { createEventStore } from '../event-store/index.js';
import { resolveDependencies } from '../../utils/registry/dependency-resolver.js';

export const createPersistenceContext = async (deps) => {
  const { config, eventBus } = resolveDependencies(deps, {
    config: 'config',
    eventBus: ['messaging.eventBus', 'eventBus'] // Optional dependency injection?
  });
  // Note: Persistence usually comes BEFORE messaging in init order.
  // If we inject eventBus here, we might have a circular dependency or ordering issue.
  // Registry Init Order: Persistence -> Messaging -> Domains.
  // So `eventBus` is NOT available when `PersistenceContext` is created.

  // Solution: We can't inject eventBus into EventStore at creation time if EventStore is created here.
  // Option A: Dependency Injection at runtime (setter).
  // Option B: Pass `eventBus` to `eventStore.append` from the caller (CommandBus).
  // Option C: Move `eventStore` creation to a later phase or separate context.

  // Let's stick to the current "Contexts" architecture.
  // If `eventStore` needs `eventBus`, maybe `eventStore` belongs in a higher level or `infra.messaging` should depend on `infra.persistence` (which it does)
  // and we wire them up in a third place?

  // Actually, the `CommandBus` (in domain layer) has access to both `eventStore` and `eventBus`.
  // It might be cleaner if the `CommandBus` handles the publishing after calling `eventStore.append`.
  // However, `EventStore` is the "Single Source of Truth".

  // Let's look at `createCommandBus` in `src/infra/command-bus/index.js`.
  // It takes `kvPool` and `eventStore`.
  // We can modify `CommandBus` to take `eventBus` and publish events there.
  // That avoids the circular dependency issue in `PersistenceContext`.

  const poolSize = config?.get('database.kv.poolSize') || 5;

  const kvPool = createKVPool(poolSize);
  await kvPool.initialize();

  const cache = createCache(kvPool);

  // We initialize EventStore without EventBus here.
  // The publishing responsibility will be handled by the CommandBus or a composite service.
  const eventStore = createEventStore(kvPool);

  return {
    kvPool,
    cache,
    eventStore,
    shutdown: async () => {
      await kvPool.close();
    }
  };
};

export const PersistenceContext = {
  name: 'infra.persistence',
  factory: createPersistenceContext
};
