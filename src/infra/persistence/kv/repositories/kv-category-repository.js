export const createKVCategoryRepository = (kvPool) => {
  const save = async (tenantId, category) => {
    return kvPool.withConnection(async (kv) => {
      await kv.set(['tenants', tenantId, 'categories', category.id], category);
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
