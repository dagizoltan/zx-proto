
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createEventStore } from "../../infra/event-store/index.js";
import { createCommandBus } from "../../infra/command-bus/index.js";
import { createOutboxWorker } from "../../infra/messaging/worker/outbox-worker.js";

// Import Domains
import { createOrderHandlers, InitializeOrder, OrderConfirmed } from "../orders/domain.js";
import { createShipmentHandlers, ShipmentCreated } from "./domain/index.js";
import { createShipmentProcessManager } from "./process-manager.js";

// Mock Event Bus
const createEventBus = () => {
    const handlers = new Map();
    const published = [];
    return {
        publish: async (type, payload) => {
            published.push({ type, payload });
            const subs = handlers.get(type) || [];
            await Promise.all(subs.map(fn => fn(payload)));
        },
        subscribe: (type, fn) => {
            if (!handlers.has(type)) handlers.set(type, []);
            handlers.get(type).push(fn);
        },
        getPublished: () => published
    };
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

Deno.test("Shipment Flow - Reactive Creation", async () => {
    const kv = await Deno.openKv(":memory:");
    const pool = { withConnection: async (cb) => cb(kv) };
    const eventBus = createEventBus();
    const eventStore = createEventStore(pool);
    const worker = createOutboxWorker(pool, eventBus);
    await worker.start();

    // 1. Setup Shipments
    const shipmentCommandBus = createCommandBus(pool, eventStore);
    const shipmentHandlers = createShipmentHandlers();
    Object.keys(shipmentHandlers).forEach(k => shipmentCommandBus.registerHandler(k, shipmentHandlers[k]));

    // Mock Order Read Repo for Process Manager
    const mockOrderRepo = {
        findById: async (tid, oid) => {
            return {
                id: oid,
                items: [{ productId: 'p1', quantity: 1 }],
                shippingAddress: { street: '123 Test St' }
            };
        }
    };

    const processManager = createShipmentProcessManager(shipmentCommandBus, mockOrderRepo);

    // Wire Up
    eventBus.subscribe('OrderConfirmed', async (data) => processManager.handle(data));

    // 2. Trigger OrderConfirmed Event (Simulate Order Context)
    // We don't need the whole Order stack, just the event firing.
    // But to use Outbox, we should append via EventStore or simulate the bus.
    // Let's use `eventBus.publish` directly to simulate the "Incoming" event from another context.

    const tenantId = "tenant-1";
    const orderId = "ord-confirmed-1";

    await eventBus.publish('OrderConfirmed', {
        type: 'OrderConfirmed',
        tenantId,
        data: {
            orderId,
            confirmedAt: Date.now()
        }
    });

    // 3. Verify Shipment Created
    // Process Manager -> CommandBus -> EventStore -> Outbox -> EventBus (ShipmentCreated)
    // But CommandBus executes handler which commits to store.

    // Check EventStore for Shipment Stream
    // We don't know the shipmentId generated (UUID).
    // Use `readAllEvents` or check if `ShipmentCreated` was published to bus (if we subscribed to it).

    let shipmentCreatedEvent = null;
    eventBus.subscribe('ShipmentCreated', (data) => { shipmentCreatedEvent = data; });

    await wait(200); // Wait for async process

    // Did we get a shipment?
    // We might not get it on the bus if we didn't wire `ShipmentCreated` to be published?
    // Wait, `CommandBus` -> `EventStore` -> `Outbox` -> `Worker` -> `EventBus`.
    // So yes, it should be on the bus.

    assertExists(shipmentCreatedEvent, "ShipmentCreated event should have been fired");
    assertEquals(shipmentCreatedEvent.data.orderId, orderId);
    assertEquals(shipmentCreatedEvent.data.address.street, '123 Test St');

    kv.close();
});
