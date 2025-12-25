
export const createCommandBus = (kvPool, eventStore, eventBus = null, handlers = {}) => {

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

    // Execution Context Wrapper
    const streamId = aggregateId;

    // We execute the handler.
    // The handler calls `commitEvents`.
    // We want `commitEvents` to also publish to `eventBus`.

    return handler(
      // loadStream context
      async () => {
         const events = await eventStore.readStream(command.tenantId, streamId);
         return events;
      },
      // commitEvents context
      async (eventsToCommit, expectedVersion) => {
         // 1. Persist
         const committed = await eventStore.append(command.tenantId, streamId, eventsToCommit, expectedVersion);

         // 2. Publish (Side Effect)
         if (eventBus && committed.length > 0) {
             // We fire and forget here to keep command latency low,
             // OR we await to ensure at least the bus accepted it.
             // Given "High Performance" requirement, let's await with a timeout or just await.
             // `eventBus.publish` in `kv-queue` is fast (just a KV write).
             try {
                await Promise.all(committed.map(evt => eventBus.publish(evt.type, evt)));
             } catch (err) {
                console.error("Failed to publish events to bus", err);
                // System design decision: Do we fail the command?
                // No, persistence succeeded. We rely on a background sweeper/outbox in a full system.
             }
         }
         return committed;
      },
      command
    );
  };

  return {
    registerHandler,
    execute
  };
};
