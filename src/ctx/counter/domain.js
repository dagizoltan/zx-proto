
// EVENTS
export const CounterIncremented = 'CounterIncremented';
export const CounterDecremented = 'CounterDecremented';

// COMMANDS
export const IncrementCounter = 'IncrementCounter';
export const DecrementCounter = 'DecrementCounter';

// COMMAND HANDLERS
export const createCounterHandlers = () => {
  return {
    [IncrementCounter]: async (loadStream, commitEvents, command) => {
      const { amount } = command.payload;

      // 1. Load History (if needed for business logic validation)
      // In this simple case, we don't strictly need history to increment,
      // but let's say we do to calculate the next version correctly if we were doing logic based on state.
      const history = await loadStream();
      const currentVersion = history.length > 0 ? history[history.length - 1].version : 0;

      // 2. Validate (e.g. max value?)

      // 3. Emit Event
      const event = {
        type: CounterIncremented,
        data: { amount }
      };

      // 4. Commit
      return await commitEvents([event], currentVersion);
    },
    [DecrementCounter]: async (loadStream, commitEvents, command) => {
      const { amount } = command.payload;
      const history = await loadStream();
      const currentVersion = history.length > 0 ? history[history.length - 1].version : 0;

      const event = {
        type: CounterDecremented,
        data: { amount }
      };

      return await commitEvents([event], currentVersion);
    }
  };
};

// READ MODEL (Projector)
export const createCounterProjector = (kvPool) => {
  const handle = async (event) => {
    // In a real app, we'd update a KV entry optimized for reading.
    // Key: ['view', 'counter', tenantId, counterId]
    const { tenantId, streamId, data, type } = event;

    // We assume streamId IS the counterId for simplicity
    const counterId = streamId;
    const key = ['view', 'counter', tenantId, counterId];

    await kvPool.withConnection(async (kv) => {
      const currentResult = await kv.get(key);
      const currentValue = currentResult.value || { count: 0 };

      let newCount = currentValue.count;
      if (type === CounterIncremented) {
        newCount += data.amount;
      } else if (type === CounterDecremented) {
        newCount -= data.amount;
      }

      await kv.set(key, { count: newCount, lastUpdated: Date.now() });
    });
  };

  return {
    handle
  };
};
