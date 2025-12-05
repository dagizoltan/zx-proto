export const createKVPriceListRepository = (kvPool) => {
  const save = async (tenantId, priceList) => {
    return kvPool.withConnection(async (kv) => {
      await kv.set(['tenants', tenantId, 'pricelists', priceList.id], priceList);
      return priceList;
    });
  };

  const findById = async (tenantId, id) => {
    return kvPool.withConnection(async (kv) => {
      const res = await kv.get(['tenants', tenantId, 'pricelists', id]);
      return res.value;
    });
  };

  const findAll = async (tenantId, { limit = 10, cursor, search } = {}) => {
    return kvPool.withConnection(async (kv) => {
      const iter = kv.list({ prefix: ['tenants', tenantId, 'pricelists'] }, { cursor });
      const items = [];
      let nextCursor = null;

      const searchTerm = search ? search.toLowerCase() : null;

      for await (const res of iter) {
        const pl = res.value;
        let match = true;

        if (match && searchTerm) {
            const inName = pl.name?.toLowerCase().includes(searchTerm);
            if (!inName) match = false;
        }

        if (match) {
          items.push(pl);
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
