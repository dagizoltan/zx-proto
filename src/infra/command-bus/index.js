
export const createCommandBus = (kvPool, eventStore, handlers = {}) => {

  const registerHandler = (commandType, handler) => {
    handlers[commandType] = handler;
  };

  const execute = async (command) => {
    const { type, aggregateId } = command;
    const handler = handlers[type];

    if (!handler) {
      throw new Error(`Unknown command type: ${type}`);
    }

    if (!aggregateId) {
      throw new Error(`Command ${type} missing aggregateId`);
    }

    // For now, we are executing purely in-memory.
    // ADR-003 suggests "Aggregate-Scoped Command Serialization".
    // In a distributed system, we'd use a queue or a lock in KV.
    // For this MVP step, we will use a simple in-memory mutex per aggregate
    // to prevent race conditions within this single process.
    // If we scale to multiple instances, we MUST move this locking to KV (e.g. leases).

    // Simplification for MVP: Just execute. The EventStore optimistic concurrency
    // will catch race conditions at the data layer if two parallel requests try to write
    // to the same stream at the same time. The Command Bus SHOULD serialize to avoid
    // the retry loop overhead, but strictly speaking, EventStore protection is the safety net.

    // Let's implement a basic KV lock to respect the ADR's "KV-backed queue" or "serialization" intent
    // more robustly if possible, OR rely on the `expectedVersion` check in EventStore as the
    // ultimate serialization mechanism.

    // ADR-003 says: "Commands are serialized per aggregate ID using an in-memory or KV-backed queue."

    // We'll implement the handler logic:
    // 1. Load History
    // 2. Hydrate State
    // 3. Execute Command -> New Events
    // 4. Append Events (with version check)

    // The "Serialization" part implies we should queue these executions.
    // For now, we will execute directly and rely on Event Store optimistic locking to fail concurrent writes.
    // To truly serialize, we'd need a worker loop consuming a queue.
    // Given the scope, direct execution + Optimistic Locking is a valid start for "Safety",
    // but less so for "Throughput" (retries).

    // We will follow the standard pattern:

    const streamId = aggregateId; // Or compose type + id
    // NOTE: In a real app, streamId might be `order-${aggregateId}`.
    // The handler should probably know how to derive streamId or it's passed in.

    // We assume the handler is a function: `(state, command) => events`
    // And we need a `reducer`: `(state, event) => state`
    // But usually handlers are more complex.
    // Let's assume the handler takes `(repository, command)` or similar.

    // Let's try a functional approach:
    // Handler: `async (loadStream, commitEvents, command) => void`

    return handler(
      // loadStream context
      async () => {
         const events = await eventStore.readStream(command.tenantId, streamId);
         return events;
      },
      // commitEvents context
      async (eventsToCommit, expectedVersion) => {
         return await eventStore.append(command.tenantId, streamId, eventsToCommit, expectedVersion);
      },
      command
    );
  };

  return {
    registerHandler,
    execute
  };
};
