export const createBaseRepository = (kvPool, entityPrefix) => {
  const findById = async (tenantId, id) => {
    return kvPool.withConnection(async (kv) => {
      const res = await kv.get(['tenants', tenantId, entityPrefix, id]);
      return res.value;
    });
  };

  const findAll = async (tenantId, { limit = 10, cursor, prefix = null } = {}) => {
    return kvPool.withConnection(async (kv) => {
      const listPrefix = prefix || ['tenants', tenantId, entityPrefix];
      // Note: kv.list limit applies to scanned items.
      // If we need filtering, base repository might need a callback.
      // For now, basic list.
      const iter = kv.list({ prefix: listPrefix }, { cursor, limit });
      const items = [];
      for await (const res of iter) {
        items.push(res.value);
      }
      return { items, nextCursor: iter.cursor };
    });
  };

  const save = async (tenantId, entity) => {
      return kvPool.withConnection(async (kv) => {
          await kv.set(['tenants', tenantId, entityPrefix, entity.id], entity);
          return entity;
      });
  };

  const deleteById = async (tenantId, id) => {
       return kvPool.withConnection(async (kv) => {
          await kv.delete(['tenants', tenantId, entityPrefix, id]);
      });
  };

  return { findById, findAll, save, deleteById };
};
