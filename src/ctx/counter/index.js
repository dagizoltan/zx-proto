
import { createCommandBus } from '../../infra/command-bus/index.js';
import { resolveDependencies } from '../../utils/registry/dependency-resolver.js';
import { createCounterHandlers, createCounterProjector, CounterIncremented, CounterDecremented } from './domain.js';

export const createCounterContext = async (deps) => {
  const { eventStore, kvPool, eventBus } = resolveDependencies(deps, {
    eventStore: ['persistence.eventStore'],
    kvPool: ['persistence.kvPool'],
    eventBus: ['messaging.eventBus'] // We can use the existing eventBus for broadcasting committed events to projectors
  });

  // 1. Setup Command Bus
  const commandBus = createCommandBus(kvPool, eventStore);
  const handlers = createCounterHandlers();

  // Register Command Handlers
  Object.entries(handlers).forEach(([type, handler]) => {
      commandBus.registerHandler(type, handler);
  });

  // 2. Setup Projectors
  // Note: In a real system (ADR-004), we'd have a mechanism to subscribe projectors to the Event Store stream.
  // For now, we can hook into the command bus execution pipeline OR rely on the `eventBus` if we publish events there after commit.
  // Our `EventStore` implementation is raw and doesn't publish to `eventBus`.
  // To verify the flow:
  // We need a way to trigger the projector.
  // Let's modify `CommandBus` or wrapping logic to publish events after commit?
  // Or simpler: The "Proof of Concept" allows us to manually trigger projection or just verify the EventStore part.

  // Let's make the CommandHandler also publish to the legacy `eventBus` so we can hook the projector there.
  // This bridges the new Event Sourcing world with the existing Event Bus.

  // Actually, better: Listen to the Event Store? No, Deno KV listenQueue is for queue.
  // Let's just expose the projector so we can call it in tests or via a manual subscription.

  const projector = createCounterProjector(kvPool);

  // Wiring: When an event is committed, we should ideally project it.
  // For this simplified PoC, we will assume "someone" calls the projector.
  // (In a full implementation, we'd have a `catch-up` subscription or a `listen` on the store).

  return {
    commandBus,
    projector
  };
};

export const CounterContext = {
    name: 'domain.counter',
    dependencies: ['infra.persistence', 'infra.messaging'],
    factory: createCounterContext
};
