
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createKVRoleRepositoryAdapter } from './kv-role-repository.adapter.js';
import { createTestKvPool } from '../../../../test-utils/kv-pool.js';
import { createRole } from '../../domain/entities/role.js';

Deno.test("KV Role Repository Adapter", async (t) => {
    const kvPool = await createTestKvPool();
    const repo = createKVRoleRepositoryAdapter(kvPool);
    const tenantId = "test-tenant";

    const testRole = createRole({
        id: "role-123",
        name: "admin",
        permissions: [{ resource: "all", action: "all" }]
    });

    await t.step("save", async () => {
        const result = await repo.save(tenantId, testRole);
        assert(result.ok);
        assertEquals(result.value.id, testRole.id);
        assertEquals(result.value.name, testRole.name);
    });

    await t.step("findById", async () => {
        const result = await repo.findById(tenantId, testRole.id);
        assert(result.ok);
        assertEquals(result.value.id, testRole.id);
    });

    await t.step("list", async () => {
        const result = await repo.list(tenantId);
        assert(result.ok);
        assert(result.value.items.length > 0);
    });

    await kvPool.close();
});
