export const createKVProductRepository = (kvPool) => {
  const save = async (tenantId, product, expectedVersion = null) => {
    return kvPool.withConnection(async (kv) => {
      const primaryKey = ['tenants', tenantId, 'products', product.id];
      const skuIndexKey = ['tenants', tenantId, 'products_by_sku', product.sku];

      const atomic = kv.atomic();

      // CRITICAL FIX: Add version check for optimistic concurrency control
      if (expectedVersion) {
        atomic.check({ key: primaryKey, versionstamp: expectedVersion });
      }

      atomic
        .set(primaryKey, product)
        .set(skuIndexKey, product.id);

      const commit = await atomic.commit();

      if (!commit.ok) {
          throw new Error('Concurrent modification detected (Product Version Mismatch)');
      }

      return product;
    });
  };

  const findById = async (tenantId, id) => {
    return kvPool.withConnection(async (kv) => {
      const res = await kv.get(['tenants', tenantId, 'products', id]);
      return res.value;
    });
  };

  // NEW: Batch Fetch
  const findByIds = async (tenantId, ids) => {
    if (!ids || ids.length === 0) return [];
    return kvPool.withConnection(async (kv) => {
        const keys = ids.map(id => ['tenants', tenantId, 'products', id]);
        // Deno KV getMany returns array of { key, value, versionstamp }
        const results = await kv.getMany(keys);
        return results.map(r => r.value).filter(p => p !== null);
    });
  };

  // New method to support OCC
  const getWithVersion = async (tenantId, id) => {
      return kvPool.withConnection(async (kv) => {
          const res = await kv.get(['tenants', tenantId, 'products', id]);
          return { value: res.value, versionstamp: res.versionstamp };
      });
  };

  const findBySku = async (tenantId, sku) => {
    return kvPool.withConnection(async (kv) => {
        const indexRes = await kv.get(['tenants', tenantId, 'products_by_sku', sku]);
        if (!indexRes.value) return null;

        const productId = indexRes.value;
        const res = await kv.get(['tenants', tenantId, 'products', productId]);
        return res.value;
    });
  };

  const findAll = async (tenantId, { limit = 10, cursor, status, search, minPrice, maxPrice } = {}) => {
    return kvPool.withConnection(async (kv) => {
      if (search && !cursor && !status && !minPrice && !maxPrice) {
          const indexRes = await kv.get(['tenants', tenantId, 'products_by_sku', search]);
          if (indexRes.value) {
              const res = await kv.get(['tenants', tenantId, 'products', indexRes.value]);
              if (res.value) {
                  return { items: [res.value], nextCursor: null };
              }
          }
      }

      const iter = kv.list({ prefix: ['tenants', tenantId, 'products'] }, { cursor });
      const products = [];
      let nextCursor = null;

      const searchTerm = search ? search.toLowerCase() : null;

      for await (const res of iter) {
        const product = res.value;
        let match = true;

        if (status && product.status !== status) match = false;
        if (match && minPrice !== undefined && product.price < minPrice) match = false;
        if (match && maxPrice !== undefined && product.price > maxPrice) match = false;

        if (match && searchTerm) {
          const inName = product.name?.toLowerCase().includes(searchTerm);
          const inSku = product.sku?.toLowerCase().includes(searchTerm);
          const inId = product.id?.toLowerCase().includes(searchTerm);

          if (!inName && !inSku && !inId) match = false;
        }

        if (match) products.push(product);

        if (products.length >= limit) {
          nextCursor = iter.cursor;
          break;
        }
      }

      return { items: products, nextCursor };
    });
  };

<<<<<<< HEAD
  return { save, findById, findByIds, findBySku, findAll, getWithVersion };
=======
  return { save, findById, findByIds, findBySku, findAll };
>>>>>>> fix-critical-bugs-and-refactor-routing-11322124717493770469
};
