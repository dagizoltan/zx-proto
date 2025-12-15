
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVUserRepositoryAdapter } from './kv-user-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createUser } from '../../domain/entities/user.js';

Deno.test("KV User Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVUserRepositoryAdapter(kvPool);
    const tenantId = "test-tenant";

    const testUser = createUser({
        id: "user-123",
        email: "test@example.com",
        passwordHash: "hashed_password",
        name: "Test User",
        roleIds: []
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testUser);
        assert(result.ok);
        assertEquals(result.value.id, testUser.id);
        assertEquals(result.value.email, testUser.email);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testUser.id);
        assert(result.ok);
        assertEquals(result.value.id, testUser.id);
    });

    await t.step("findByEmail", async () => {
        const result = await repo.findByEmail(tenantId, testUser.email);
        assert(result.ok);
        assertEquals(result.value.id, testUser.id);
    });

     await t.step("list", async () => {
        const result = await repo.list(tenantId);
        assert(result.ok);
        assert(result.value.items.length > 0);
    });

    await kvPool.close();
});
