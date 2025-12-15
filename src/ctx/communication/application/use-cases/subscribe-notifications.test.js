import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createSubscribeNotifications } from "./subscribe-notifications.js";

Deno.test("Communication - Subscribe Notifications", async (t) => {
  const tenantId = "test-tenant";
  const userId = "user-1";

  await t.step("should return a readable stream and clean up", async () => {
    // Mocks
    const eventBus = {
      subscribe: (topic, handler) => {
          assertEquals(topic, "notification.created");
          return () => {}; // Unsubscribe mock
      },
    };

    const useCase = createSubscribeNotifications({ eventBus });

    const stream = useCase(tenantId, userId);

    assert(stream instanceof ReadableStream);

    // Cancel the stream to clear the interval
    await stream.cancel();
  });
});
