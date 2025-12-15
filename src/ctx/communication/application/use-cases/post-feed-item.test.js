import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createPostFeedItem } from "./post-feed-item.js";
import { Ok, Err } from "../../../../../lib/trust/index.js";

Deno.test("Communication - Post Feed Item", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should post feed item successfully", async () => {
    // Mocks
    const feedRepository = {
      save: (tid, item) => Promise.resolve(Ok(item)),
    };
    const eventBus = { publish: () => Promise.resolve() };

    const useCase = createPostFeedItem({ feedRepository, eventBus });

    const input = {
      authorId: "user-1",
      content: "Hello World",
      channelId: "channel-1", // Was missing
      type: "post",
      visibility: "PUBLIC"
    };

    const result = await useCase(tenantId, input);

    if (!result.ok) {
        console.error(result.error);
    }
    assert(result.ok);
    assertEquals(result.value.content, "Hello World");
  });
});
