
export const createEventStore = (kvPool, eventBus = null) => {

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

      // 5. Publish to EventBus (Side Effects)
      // We do this AFTER a successful commit.
      // Note: In a distributed system, this 'dual write' (DB + Bus) can be risky if the process crashes in between.
      // Deno KV Queues allow atomic enqueueing WITH the write, but our eventBus abstraction might wrap that.
      // If eventBus.publish uses `kv.enqueue` inside `kv.atomic()`, we should pass the atomicOp to it.
      // But our current EventBus implementation takes `kvPool` and does its own tx.
      // For this MVP, we will await the publish. If it fails, the event is saved but not published.
      // A robust system (ADR-006/007) would use a "Transaction Outbox" or tail the log.
      // Since we want "High Performance" and "Decoupling", firing to the bus is crucial.

      if (eventBus) {
        try {
            // Fire and forget? Or await?
            // Awaiting ensures we know it reached the bus, but adds latency.
            // Fire and forget risks silent failure.
            // We'll await to ensure the "Process Manager" will definitely get it.
            await Promise.all(committedEvents.map(evt => eventBus.publish(evt.type, evt)));
        } catch (e) {
            console.error('Failed to publish events to bus after commit:', e);
            // We do NOT revert the commit, as the source of truth (EventStore) is updated.
            // This is a known "at least once" vs "at most once" trade-off area.
        }
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
