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

  return { save, findById, findBySku };
};
