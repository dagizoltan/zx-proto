
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVNotificationRepository } from './kv-notification-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createNotification } from '../../domain/entities/notification.js';

Deno.test("KV Notification Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVNotificationRepository(kvPool);
    const tenantId = "test-tenant";

    const testNotification = createNotification({
        id: crypto.randomUUID(),
        tenantId,
        userId: crypto.randomUUID(),
        title: "Welcome!",
        message: "Welcome to the system.",
        level: "info"
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testNotification);
        assert(result.ok, `Save failed: ${result.error?.message}`);
        assertEquals(result.value.id, testNotification.id);
        assertEquals(result.value.title, testNotification.title);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testNotification.id);
        assert(result.ok);
        assertEquals(result.value.id, testNotification.id);
    });

    await t.step("queryByIndex (userId)", async () => {
        const result = await repo.queryByIndex(tenantId, "userId", testNotification.userId);
        assert(result.ok);
        assert(result.value.items.length > 0);
    });

    await kvPool.close();
});
