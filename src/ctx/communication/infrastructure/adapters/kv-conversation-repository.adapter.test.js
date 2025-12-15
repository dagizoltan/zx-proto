
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVConversationRepository } from './kv-conversation-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createConversation } from '../../domain/entities/conversation.js';

Deno.test("KV Conversation Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVConversationRepository(kvPool);
    const tenantId = "test-tenant";

    const testConversation = createConversation({
        id: crypto.randomUUID(),
        tenantId,
        participantIds: [crypto.randomUUID(), crypto.randomUUID()],
        lastMessagePreview: "Hello World"
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testConversation);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testConversation.id);
        assertEquals(result.value.participantIds.length, 2);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testConversation.id);
        assert(result.ok);
        assertEquals(result.value.id, testConversation.id);
    });

    await t.step("list", async () => {
        const result = await repo.list(tenantId);
        assert(result.ok);
        assert(result.value.items.length > 0);
    });

    await kvPool.close();
});
