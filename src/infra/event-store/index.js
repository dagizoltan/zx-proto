
export const createEventStore = (kvPool) => {

  const getStreamKey = (tenantId, streamId) => ['events', tenantId, streamId];
  const getEventKey = (tenantId, streamId, version) => [...getStreamKey(tenantId, streamId), version];

  const append = async (tenantId, streamId, events, expectedVersion) => {
    return kvPool.withConnection(async (kv) => {
      // 1. Concurrency Check
      const versionKey = ['streams', tenantId, streamId, 'version'];
      const currentVersionResult = await kv.get(versionKey);
      const currentVersion = currentVersionResult.value ?? 0;

      if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
        throw new Error(`ConcurrencyError: Expected version ${expectedVersion} but found ${currentVersion}`);
      }

      let newVersion = currentVersion;
      const atomicOp = kv.atomic();

      // 2. Prepare Events & Enqueue (Transactional Outbox)
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

        // A. Persist Event
        atomicOp.set(getEventKey(tenantId, streamId, newVersion), event);

        // B. Enqueue for Delivery (Atomic Side Effect)
        // This ensures that if the DB write succeeds, the message IS in the queue.
        // If the DB write fails/aborts, the message is NOT queued.
        atomicOp.enqueue({
          type: 'DOMAIN_EVENT',
          payload: event
        });

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
      return events.sort((a, b) => a.version - b.version);
    });
  };

  // Replay helper: Reads ALL events for a tenant
  // Note: For large datasets, this needs pagination/streaming.
  const readAllEvents = async (tenantId) => {
    return kvPool.withConnection(async (kv) => {
      const iter = kv.list({ prefix: ['events', tenantId] });
      const events = [];
      for await (const entry of iter) {
          events.push(entry.value);
      }
      // Sort globally by timestamp or version?
      // Version is per stream. Timestamp is unreliable for global ordering in distributed systems,
      // but "events" prefix sort order is effectively keys.
      // Keys are ['events', tenantId, streamId, version].
      // So we get them grouped by stream, then version.
      // For Replay, this is usually fine as long as causal dependencies (Process Managers)
      // aren't triggered (which they aren't, see Plan).
      // If Projectors need cross-stream ordering, we'd need a global sequence/index.
      // For now, stream-ordered is sufficient for independent aggregates.
      return events;
    });
  };

  return {
    append,
    readStream,
    readAllEvents
  };
};
