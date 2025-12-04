import { createEventBus } from './kv-queue/kv-event-bus.js';

export const createMessagingContext = async (deps) => {
  const { persistence } = deps;

  const eventBus = createEventBus(persistence.kvPool);
  await eventBus.startListening();

  return {
    eventBus,
  };
};
