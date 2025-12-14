export const createEventBus = (kvPool) => {
  const handlers = new Map();
  let isListening = false;

  const publish = async (eventType, payload) => {
    return kvPool.withConnection(async (kv) => {
      const event = {
        id: crypto.randomUUID(),
        type: eventType,
        payload,
        timestamp: Date.now(),
        processed: false,
      };

      await kv.set(['events', 'queue', event.id], event);
      await kv.enqueue(event);

      return event.id;
    });
  };

  const subscribe = (eventType, handler) => {
    if (!handlers.has(eventType)) {
      handlers.set(eventType, []);
    }
    const eventHandlers = handlers.get(eventType);
    eventHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = eventHandlers.indexOf(handler);
      if (index > -1) {
        eventHandlers.splice(index, 1);
      }
    };
  };

  const startListening = async () => {
    if (isListening) return;
    isListening = true;

    await kvPool.withConnection(async (kv) => {
      kv.listenQueue(async (event) => {
        const eventHandlers = handlers.get(event.type) || [];

        // Clone array to avoid issues if handlers unsubscribe during execution
        for (const handler of [...eventHandlers]) {
          try {
            await handler(event.payload);
          } catch (error) {
            console.error(`Error handling event ${event.type}:`, error);
          }
        }

        await kv.set(['events', 'processed', event.id], {
          ...event,
          processed: true,
          processedAt: Date.now(),
        });
      });
    });
  };

  return { publish, subscribe, startListening };
};
