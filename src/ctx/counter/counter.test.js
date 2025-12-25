
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createEventStore } from "../../infra/event-store/index.js";
import { createCommandBus } from "../../infra/command-bus/index.js";
import { createCounterHandlers, createCounterProjector, IncrementCounter, CounterIncremented } from "./domain.js";

Deno.test("Counter Domain - Integration", async () => {
    const kv = await Deno.openKv(":memory:");
    const pool = { withConnection: async (cb) => cb(kv) };

    // 1. Setup Infra
    const eventStore = createEventStore(pool);
    const commandBus = createCommandBus(pool, eventStore);
    const projector = createCounterProjector(pool);

    // 2. Register Handlers
    const handlers = createCounterHandlers();
    Object.entries(handlers).forEach(([type, handler]) => {
        commandBus.registerHandler(type, handler);
    });

    const tenantId = "test-tenant";
    const counterId = "counter-1";

    // 3. Execute Command
    const command = {
        type: IncrementCounter,
        aggregateId: counterId,
        tenantId,
        payload: { amount: 5 }
    };

    // We need to capture the committed events to feed the projector manually in this test
    // (Since we don't have an automated subscription yet)

    // A trick to "spy" on the event store or command bus?
    // The commandBus returns the result of the handler.
    // Our handler returns the result of `commitEvents`, which returns the committed events.
    const committedEvents = await commandBus.execute(command);

    assertEquals(committedEvents.length, 1);
    assertEquals(committedEvents[0].type, CounterIncremented);
    assertEquals(committedEvents[0].data.amount, 5);
    assertEquals(committedEvents[0].version, 1);

    // 4. Run Projector
    for (const event of committedEvents) {
        await projector.handle(event);
    }

    // 5. Verify Read Model
    const key = ['view', 'counter', tenantId, counterId];
    const result = await kv.get(key);
    assertEquals(result.value.count, 5);

    kv.close();
});
