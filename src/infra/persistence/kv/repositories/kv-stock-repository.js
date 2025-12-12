import { createRepository, useSchema, useIndexing, isErr } from '../../../../../lib/trust/index.js';
import { StockEntrySchema } from '../../../../ctx/inventory/domain/schemas/inventory.schema.js';

export const createKVStockRepository = (kvPool) => {
    const repo = createRepository(kvPool, 'stock', [
        useSchema(StockEntrySchema),
        useIndexing({
            'product': (s) => s.productId,
            'location': (s) => s.locationId,
            'batch': (s) => s.batchId
        })
    ]);

    return {
        ...repo,
        findEntry: async (tenantId, productId, locationId, batchId) => {
            const res = await repo.queryByIndex(tenantId, 'product', productId, { limit: 1000 });
            if (isErr(res)) return res;

            const entry = res.value.items.find(s =>
                s.locationId === locationId && s.batchId === batchId
            );

            return { ok: true, value: entry || null };
        }
    };
};
