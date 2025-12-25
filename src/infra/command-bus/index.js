
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

    const streamId = aggregateId;

    return handler(
      // loadStream context
      async () => {
         const events = await eventStore.readStream(command.tenantId, streamId);
         return events;
      },
      // commitEvents context
      async (eventsToCommit, expectedVersion) => {
         // 1. Persist (and Enqueue via Outbox in EventStore)
         const committed = await eventStore.append(command.tenantId, streamId, eventsToCommit, expectedVersion);

         // 2. No Manual Publish
         // The EventStore.append now handles the Outbox enqueue.
         // The Outbox Worker handles the dispatch to EventBus.
         // This decouples Command Processing from Event Handling completely.

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
