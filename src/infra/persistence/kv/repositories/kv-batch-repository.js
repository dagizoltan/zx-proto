export const createKVBatchRepository = (kvPool) => {
  const save = async (tenantId, batch) => {
    return kvPool.withConnection(async (kv) => {
      await kv.set(['tenants', tenantId, 'batches', batch.id], batch);
      return batch;
    });
  };

  const findById = async (tenantId, id) => {
    return kvPool.withConnection(async (kv) => {
      const res = await kv.get(['tenants', tenantId, 'batches', id]);
      return res.value;
    });
  };

  const findByIds = async (tenantId, ids) => {
    if (!ids || ids.length === 0) return [];
    return kvPool.withConnection(async (kv) => {
      const keys = ids.map(id => ['tenants', tenantId, 'batches', id]);
      const BATCH_SIZE = 10;
      const results = [];

      for (let i = 0; i < keys.length; i += BATCH_SIZE) {
        const chunk = keys.slice(i, i + BATCH_SIZE);
        const chunkRes = await kv.getMany(chunk);
        results.push(...chunkRes);
      }

      return results.map(r => r.value).filter(v => v !== null);
    });
  };

  const findBySku = async (tenantId, sku) => {
    return kvPool.withConnection(async (kv) => {
      const iter = kv.list({ prefix: ['tenants', tenantId, 'batches'] });
      const items = [];
      for await (const res of iter) {
        if (res.value.sku === sku) items.push(res.value);
      }
      return items;
    });
  };

  return { save, findById, findByIds, findBySku };
};
