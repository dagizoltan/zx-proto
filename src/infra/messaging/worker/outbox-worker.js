
export const createOutboxWorker = (kvPool, eventBus) => {
  let isListening = false;

  const start = async () => {
    if (isListening) return;
    isListening = true;

    // We start a listener on the KV Queue.
    // Deno KV Queues deliver messages "at least once".
    // We should ideally implement idempotency on the consumer side (Projectors/ProcessManagers),
    // but the EventBus logic itself is stateless.

    // Note: Deno.kv.listenQueue is global per KV instance.
    // If we have multiple contexts sharing the same KV connection,
    // we need to dispatch based on message type.

    await kvPool.withConnection(async (kv) => {
      kv.listenQueue(async (msg) => {
        try {
          // Identify our messages
          if (msg.type === 'DOMAIN_EVENT') {
             const event = msg.payload;
             // Publish to In-Memory EventBus
             // This triggers Projectors and ProcessManagers
             await eventBus.publish(event.type, event);
          } else {
             // Handle other queue messages if any
             console.warn('Unknown queue message:', msg);
          }
        } catch (error) {
          console.error('Error processing queue message:', error);
          // If we throw here, Deno KV Queue will retry the message with backoff.
          // This creates robustness!
          throw error;
        }
      });
    });

    console.log('📦 Outbox Worker started');
  };

  return {
    start
  };
};
