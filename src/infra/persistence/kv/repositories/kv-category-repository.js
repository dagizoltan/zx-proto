export const createKVCategoryRepository = (kvPool) => {
  const save = async (tenantId, category) => {
    return kvPool.withConnection(async (kv) => {
      const key = ['tenants', tenantId, 'categories', category.id];
      const existingRes = await kv.get(key);
      const existing = existingRes.value;

      const atomic = kv.atomic();
      atomic.check({ key, versionstamp: existingRes.versionstamp });
      atomic.set(key, category);

      // Index: categories_by_parent
      const newParent = category.parentId || 'root';
      const oldParent = existing ? (existing.parentId || 'root') : null;

      if (existing && oldParent !== newParent) {
          atomic.delete(['tenants', tenantId, 'categories_by_parent', oldParent, category.id]);
      }
      if (newParent) {
          atomic.set(['tenants', tenantId, 'categories_by_parent', newParent, category.id], category.id);
      }

      const res = await atomic.commit();
      if (!res.ok) throw new Error('Concurrent modification error');

      return category;
    });
  };

  const findById = async (tenantId, id) => {
    return kvPool.withConnection(async (kv) => {
      const res = await kv.get(['tenants', tenantId, 'categories', id]);
      return res.value;
    });
  };

  const findAll = async (tenantId, { limit = 10, cursor, parentId, search } = {}) => {
    return kvPool.withConnection(async (kv) => {
      // Use Index for parentId filtering if no search
      if (parentId !== undefined && !search) {
          const parentKey = parentId || 'root';
          const iter = kv.list({ prefix: ['tenants', tenantId, 'categories_by_parent', parentKey] }, { cursor, limit });
          const ids = [];
          for await (const res of iter) {
              ids.push(res.value);
          }

          if (ids.length === 0) return { items: [], nextCursor: iter.cursor };

          // Batch Fetch with Chunking (Safe Limit 10)
          const BATCH_SIZE = 10;
          const items = [];
          for (let i = 0; i < ids.length; i += BATCH_SIZE) {
              const chunk = ids.slice(i, i + BATCH_SIZE);
              const keys = chunk.map(id => ['tenants', tenantId, 'categories', id]);
              const chunkRes = await kv.getMany(keys);
              items.push(...chunkRes.map(r => r.value).filter(v => v !== null));
          }

          return { items, nextCursor: iter.cursor };
      }

      // Fallback: Scan
      const iter = kv.list({ prefix: ['tenants', tenantId, 'categories'] }, { cursor });
      const items = [];
      let nextCursor = null;

      const searchTerm = search ? search.toLowerCase() : null;

      for await (const res of iter) {
        const category = res.value;
        let match = true;

        if (parentId !== undefined && category.parentId !== parentId) {
          match = false;
        }

        if (match && searchTerm) {
            const inName = category.name?.toLowerCase().includes(searchTerm);
            if (!inName) match = false;
        }

        if (match) {
          items.push(category);
        }

        if (items.length >= limit) {
          nextCursor = iter.cursor;
          break;
        }
      }

      return { items, nextCursor };
    });
  };

  return { save, findById, findAll };
};
