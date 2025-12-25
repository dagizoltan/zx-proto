
import { createKVPool } from '../src/infra/persistence/kv/kv-connection-pool.js';
import { createEventStore } from '../src/infra/event-store/index.js';
import { createReplayService } from '../src/infra/replay/index.js';

// Import Projectors
import { createOrderProjector } from '../src/ctx/orders/projector.js';
import { createInventoryProjector } from '../src/ctx/inventory/projector.js';
import { createShipmentProjector } from '../src/ctx/shipments/projector.js';

// Simple EventBus for Replay (In-Memory, no side effects)
const createReplayBus = () => {
    const handlers = new Map();
    return {
        subscribe: (type, handler) => {
            if (!handlers.has(type)) handlers.set(type, []);
            handlers.get(type).push(handler);
        },
        publish: async (type, payload) => {
            const subscribers = handlers.get(type) || [];
            await Promise.all(subscribers.map(fn => fn(payload)));
        }
    };
};

const main = async () => {
    const args = Deno.args;
    const command = args[0];

    if (!command) {
        console.log("Usage: deno task ops <command> [args]");
        console.log("Commands:");
        console.log("  inspect <tenantId> <streamId>   Dump events for a stream");
        console.log("  replay <tenantId>               Rebuild Read Models");
        Deno.exit(1);
    }

    // Initialize Infra
    // We use a pool size of 1 for CLI tools usually
    const kvPool = createKVPool(1);
    await kvPool.initialize();

    try {
        const eventStore = createEventStore(kvPool);

        if (command === 'inspect') {
            const tenantId = args[1];
            const streamId = args[2];

            if (!tenantId || !streamId) {
                console.error("Error: Missing tenantId or streamId");
                Deno.exit(1);
            }

            console.log(`🔍 Inspecting Stream: ${streamId} (Tenant: ${tenantId})`);
            const events = await eventStore.readStream(tenantId, streamId);

            if (events.length === 0) {
                console.log("No events found.");
            } else {
                events.forEach(e => {
                    console.log(`[v${e.version}] ${e.type} (${new Date(e.timestamp).toISOString()})`);
                    console.log(JSON.stringify(e.data, null, 2));
                    console.log('---');
                });
            }

        } else if (command === 'replay') {
            const tenantId = args[1];
            if (!tenantId) {
                console.error("Error: Missing tenantId");
                Deno.exit(1);
            }

            console.log(`🔄 Starting Replay for Tenant: ${tenantId}`);

            const bus = createReplayBus();
            const replayer = createReplayService(eventStore, bus);

            // Wire Projectors
            const orderProjector = createOrderProjector(kvPool);
            const inventoryProjector = createInventoryProjector(kvPool);
            const shipmentProjector = createShipmentProjector(kvPool);

            // Subscribe ALL projectors to ALL relevant events
            // We can wire specifically, or just wire them all to listen to everything and filter internally (Projectors usually check event type).
            // Our Projectors check `event.type` in switch statements, so it's safe to subscribe them to everything
            // IF the bus supports wildcard or we list all types.
            // Our simple bus needs explicit types.

            const wire = (p, types) => types.forEach(t => bus.subscribe(t, async (d) => {
                try {
                    await p.handle(d);
                } catch (e) {
                    console.error(`Error projecting ${t}:`, e);
                }
            }));

            // Orders
            wire(orderProjector, ['OrderInitialized', 'OrderConfirmed', 'OrderRejected']);

            // Inventory
            wire(inventoryProjector, ['StockReceived', 'StockReserved', 'StockReleased', 'StockShipped']);

            // Shipments
            wire(shipmentProjector, ['ShipmentCreated', 'ShipmentShipped']);

            // Manufacturing? We didn't create a Manufacturing Projector yet (Read Model),
            // we used legacy repos for read. But if we did, wire it here.

            const count = await replayer.replay(tenantId);
            console.log(`✅ Replay Complete. Processed ${count} events.`);
        } else {
            console.error(`Unknown command: ${command}`);
        }

    } catch (err) {
        console.error("Fatal Error:", err);
    } finally {
        await kvPool.close();
    }
};

if (import.meta.main) {
    main();
}
