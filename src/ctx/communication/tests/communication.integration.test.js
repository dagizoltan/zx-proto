import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createTestKvPool } from "../../../test-utils/kv-pool.js";
import { createKVFeedRepository } from "../infrastructure/adapters/kv-feed-repository.adapter.js";
import { createPostFeedItem } from "../application/use-cases/post-feed-item.js";

Deno.test("Communication Context - Integration Test", async (t) => {
  const kvPool = await createTestKvPool();

  await t.step("should post a feed item and verify persistence", async () => {
    // 1. Setup Infrastructure
    const feedRepository = createKVFeedRepository(kvPool);

    // 2. Setup Application
    const postFeedItem = createPostFeedItem({
      feedRepository,
      eventBus: { publish: () => {} } // Mock event bus
    });

    // 3. Execution
    const tenantId = "test-tenant-integration-comm";
    const feedInput = {
      channelId: "general",
      authorId: "user-1",
      content: "Hello World",
      type: "POST"
    };

    // Post
    const postResult = await postFeedItem(tenantId, feedInput);
    assert(postResult.ok, "Post Feed Item should be successful");
    const postedItem = postResult.value;
    assertEquals(postedItem.content, feedInput.content);

    // Verify Persistence (Direct Repo Access)
    const getResult = await feedRepository.findById(tenantId, postedItem.id);
    assert(getResult.ok, "Get Feed Item should be successful");
    const retrievedItem = getResult.value;

    assertEquals(retrievedItem.id, postedItem.id);
    assertEquals(retrievedItem.content, feedInput.content);
  });

  await kvPool.close();
});
