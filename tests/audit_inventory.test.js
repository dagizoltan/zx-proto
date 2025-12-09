
import { assertEquals } from "https://deno.land/std@0.204.0/assert/mod.ts";
import { createStockAllocationService } from '../src/ctx/inventory/domain/services/stock-allocation-service.js';

// --- Mock Repositories ---

const createMockStockRepository = (initialStock) => {
    // initialStock: Map<productId, [{ key, value, versionstamp }]>
    // Using a Map to simulate KV state in memory
    const state = new Map(initialStock);

    return {
        getEntriesWithVersion: async (tenantId, productId) => {
            // Returns deep copy to simulate fetch
            const entries = state.get(productId) || [];
            return JSON.parse(JSON.stringify(entries));
        },
        getEntriesForProduct: async (tenantId, productId) => {
             const entries = state.get(productId) || [];
             return entries.map(e => e.value);
        },
        commitUpdates: async (tenantId, updates) => {
            // Simulate Atomic Commit check
            // Check versionstamps
            for (const update of updates) {
                if (update.versionstamp !== null) {
                    // Check if current state matches versionstamp
                    // Note: In real KV, we check key existence too.
                    // This is a simplified mock.
                    let found = false;
                    for (const [pid, entries] of state.entries()) {
                        const entry = entries.find(e => JSON.stringify(e.key) === JSON.stringify(update.key));
                        if (entry) {
                            found = true;
                            if (entry.versionstamp !== update.versionstamp) {
                                return false; // Optimistic Lock Failure
                            }
                        }
                    }
                    // If supposed to exist but not found, it's complex, but for allocate/commit updates usually implies existence.
                }
            }

            // Apply updates
            for (const update of updates) {
                // Determine productId from key (simplified)
                // Key structure: ['tenants', tenantId, 'stock', productId, locationId, batchId]
                // OR ['tenants', tenantId, 'movements', ...]
                const key = update.key;

                if (key.includes('stock')) {
                    const productId = key[3];
                    const existingEntries = state.get(productId) || [];

                    // Remove old entry if exists
                    const idx = existingEntries.findIndex(e => JSON.stringify(e.key) === JSON.stringify(key));
                    if (idx >= 0) {
                        existingEntries.splice(idx, 1);
                    }

                    // Add new entry with new versionstamp
                    existingEntries.push({
                        key: update.key,
                        value: update.value,
                        versionstamp: crypto.randomUUID() // New version
                    });
                    state.set(productId, existingEntries);
                }
                // We ignore movements storage for this concurrency test
            }
            return true;
        }
    };
};

const mockBatchRepo = {
    findById: async () => ({ expiryDate: '2025-01-01' })
};

const mockProductRepo = {
    findById: async () => ({}),
    save: async () => {}
};

Deno.test("Inventory Concurrency: Atomic Allocation", async (t) => {

    await t.step("Race Condition: Two allocations competing for same stock", async () => {
        // Setup: Product P1 has 10 items.
        // User A wants 6. User B wants 6.
        // Only one should succeed.

        const productId = 'P1';
        const initialEntry = {
            key: ['tenants', 'T1', 'stock', productId, 'LOC1', 'BATCH1'],
            value: {
                locationId: 'LOC1',
                batchId: 'BATCH1',
                quantity: 10,
                reservedQuantity: 0
            },
            versionstamp: 'v1'
        };

        const stockRepo = createMockStockRepository(new Map([[productId, [initialEntry]]]));
        const service = createStockAllocationService(stockRepo, null, mockBatchRepo, mockProductRepo);

        // We need to delay the commitUpdates in the mock to allow the race to happen?
        // Actually, since `allocateBatch` fetches, calculates, then commits,
        // if we run them in parallel `Promise.all`, both will fetch 'v1'.
        // Both will calculate they can take 6.
        // Both will try to commit with `versionstamp: 'v1'`.
        // The mock `commitUpdates` is synchronous in execution but async in signature.
        // However, in the JS event loop, if we don't introduce a delay between fetch and commit,
        // the mock might serialize them purely by chance if not careful.
        // But since `allocateBatch` awaits `stockRepo.getEntriesWithVersion`, we can control that.

        // Actually, the Service loop has a retry mechanism.
        // Request 1: Get v1 -> Calc -> Commit v1 (Success) -> v2
        // Request 2: Get v1 -> Calc -> Commit v1 (Fail) -> Retry -> Get v2 -> Calc (Insufficent) -> Throw

        const reqA = service.allocateBatch('T1', [{ productId, quantity: 6 }], 'RefA');
        const reqB = service.allocateBatch('T1', [{ productId, quantity: 6 }], 'RefB');

        // We expect one to succeed and one to fail with "Insufficient stock"
        // Because 10 < 12.

        const results = await Promise.allSettled([reqA, reqB]);

        const successes = results.filter(r => r.status === 'fulfilled').length;
        const failures = results.filter(r => r.status === 'rejected').length;

        assertEquals(successes, 1, "Exactly one allocation should succeed");
        assertEquals(failures, 1, "Exactly one allocation should fail");

        if (failures > 0) {
            const error = results.find(r => r.status === 'rejected').reason;
            assertEquals(error.message.includes("Insufficient stock"), true, "Error should be insufficient stock");
        }
    });

    await t.step("Deadlock / Retry: Updates succeed after retry", async () => {
         // Setup: Product P1 has 20 items.
         // User A wants 5. User B wants 5.
         // Both should eventually succeed.

        const productId = 'P2';
        const initialEntry = {
            key: ['tenants', 'T1', 'stock', productId, 'LOC1', 'BATCH1'],
            value: {
                locationId: 'LOC1',
                batchId: 'BATCH1',
                quantity: 20,
                reservedQuantity: 0
            },
            versionstamp: 'v1'
        };

        const stockRepo = createMockStockRepository(new Map([[productId, [initialEntry]]]));
        // Add artificial delay to commitUpdates to ensure overlap
        const originalCommit = stockRepo.commitUpdates;
        stockRepo.commitUpdates = async (t, u) => {
            await new Promise(r => setTimeout(r, 10));
            return originalCommit(t, u);
        };

        const service = createStockAllocationService(stockRepo, null, mockBatchRepo, mockProductRepo);

        const reqA = service.allocateBatch('T1', [{ productId, quantity: 5 }], 'RefA');
        const reqB = service.allocateBatch('T1', [{ productId, quantity: 5 }], 'RefB');

        await Promise.all([reqA, reqB]);

        // Check final state
        const entries = await stockRepo.getEntriesForProduct('T1', productId);
        const entry = entries[0];

        assertEquals(entry.reservedQuantity, 10, "Total reserved should be 10");
    });
});
