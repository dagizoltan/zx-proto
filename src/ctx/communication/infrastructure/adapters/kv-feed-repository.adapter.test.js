
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVFeedRepository } from './kv-feed-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createFeedItem } from '../../domain/entities/feed-item.js';

Deno.test("KV Feed Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVFeedRepository(kvPool);
    const tenantId = "test-tenant";

    const testFeedItem = createFeedItem({
        id: crypto.randomUUID(),
        tenantId,
        channelId: "news-channel",
        content: "Breaking news!",
        authorId: crypto.randomUUID(),
        type: "post"
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testFeedItem);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testFeedItem.id);
        assertEquals(result.value.content, testFeedItem.content);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testFeedItem.id);
        assert(result.ok);
        assertEquals(result.value.id, testFeedItem.id);
    });

    await t.step("queryByIndex (channel)", async () => {
        const result = await repo.queryByIndex(tenantId, "channel", "news-channel");
        assert(result.ok);
        assert(result.value.items.length > 0);
    });

    await kvPool.close();
});
