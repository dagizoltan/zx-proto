
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVMessageRepository } from './kv-message-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createMessage } from '../../domain/entities/message.js';

Deno.test("KV Message Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVMessageRepository(kvPool);
    const tenantId = "test-tenant";

    const testMessage = createMessage({
        id: crypto.randomUUID(),
        tenantId,
        conversationId: crypto.randomUUID(),
        senderId: crypto.randomUUID(),
        content: "Hello, world!"
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testMessage);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testMessage.id);
        assertEquals(result.value.content, testMessage.content);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testMessage.id);
        assert(result.ok);
        assertEquals(result.value.id, testMessage.id);
    });

    await t.step("queryByIndex (conversation)", async () => {
        const result = await repo.queryByIndex(tenantId, "conversation", testMessage.conversationId);
        assert(result.ok);
        assert(result.value.items.length > 0);
    });

    await kvPool.close();
});
