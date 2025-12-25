
export const createEventStore = (kvPool) => {

  // Helper to construct the stream key
  const getStreamKey = (tenantId, streamId) => ['events', tenantId, streamId];

  // Helper to construct the specific event key
  const getEventKey = (tenantId, streamId, version) => [...getStreamKey(tenantId, streamId), version];

  const append = async (tenantId, streamId, events, expectedVersion) => {
    return kvPool.withConnection(async (kv) => {
      // 1. Concurrency Check
      // We read the last event to determine the current version
      // Optimization: Maintain a separate 'version' key for the stream for faster checks
      const versionKey = ['streams', tenantId, streamId, 'version'];
      const currentVersionResult = await kv.get(versionKey);
      const currentVersion = currentVersionResult.value ?? 0;

      if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
        throw new Error(`ConcurrencyError: Expected version ${expectedVersion} but found ${currentVersion}`);
      }

      let newVersion = currentVersion;
      const atomicOp = kv.atomic();

      // 2. Prepare Events
      const committedEvents = events.map((eventData) => {
        newVersion++;
        const event = {
          ...eventData,
          id: crypto.randomUUID(),
          tenantId,
          streamId,
          version: newVersion,
          timestamp: Date.now(),
        };

        // Add to KV transaction
        atomicOp.set(getEventKey(tenantId, streamId, newVersion), event);
        return event;
      });

      // 3. Update Stream Version
      atomicOp.check(currentVersionResult); // Optimistic Locking
      atomicOp.set(versionKey, newVersion);

      // 4. Commit
      const result = await atomicOp.commit();

      if (!result.ok) {
        throw new Error('ConcurrencyError: Commit failed due to race condition');
      }

      return committedEvents;
    });
  };

  const readStream = async (tenantId, streamId, fromVersion = 0) => {
    return kvPool.withConnection(async (kv) => {
      const iter = kv.list({ prefix: getStreamKey(tenantId, streamId) });
      const events = [];
      for await (const entry of iter) {
        if (entry.value.version > fromVersion) {
            events.push(entry.value);
        }
      }
      // Sort by version just in case, though KV list should be ordered by key
      return events.sort((a, b) => a.version - b.version);
    });
  };

  return {
    append,
    readStream
  };
};
