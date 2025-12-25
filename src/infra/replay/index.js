
export const createReplayService = (eventStore, eventBus) => {

    const replay = async (tenantId, { types = [], batchSize = 100 } = {}) => {
        console.log(`[Replay] Starting replay for tenant: ${tenantId}`);

        // 1. Read All Events
        // Optimization: Use `eventStore.readAllEvents` which streams from KV.
        const allEvents = await eventStore.readAllEvents(tenantId);

        console.log(`[Replay] Found ${allEvents.length} events.`);

        let processed = 0;

        for (const event of allEvents) {
            // Filter by type if requested
            if (types.length > 0 && !types.includes(event.type)) continue;

            // Publish to EventBus
            // NOTE: During replay, we usually want to trigger Projectors ONLY.
            // If we trigger ProcessManagers, we might re-send emails or re-charge cards!
            // Solution:
            // A. The caller passes a specific "ReplayBus" that only has Projectors subscribed.
            // B. The EventBus has a "mode" or specific "publishReplay" method.
            // C. We assume the injected `eventBus` is configured correctly (i.e., only Projectors are subscribed).

            // For this implementation, we assume the injected eventBus is the "Target" bus.
            // It is the caller's responsibility to configure the bus safely (e.g., unregister ProcessManagers).

            await eventBus.publish(event.type, event);
            processed++;
        }

        console.log(`[Replay] Completed. Processed ${processed} events.`);
        return processed;
    };

    return {
        replay
    };
};
