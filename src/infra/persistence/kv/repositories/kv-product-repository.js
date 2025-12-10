export const createKVProductRepository = (kvPool) => {
  const save = async (tenantId, product, expectedVersion = null) => {
    return kvPool.withConnection(async (kv) => {
      const primaryKey = ['tenants', tenantId, 'products', product.id];
      const skuIndexKey = ['tenants', tenantId, 'products_by_sku', product.sku];

      // Fetch existing product to clean up old indexes
      const existingRes = await kv.get(primaryKey);
      const existing = existingRes.value;

      const atomic = kv.atomic();

      // CRITICAL FIX: Add version check for optimistic concurrency control
      if (expectedVersion) {
        atomic.check({ key: primaryKey, versionstamp: expectedVersion });
      } else if (existing) {
        atomic.check({ key: primaryKey, versionstamp: existingRes.versionstamp });
      }

      atomic
        .set(primaryKey, product)
        .set(skuIndexKey, product.id);

      // Secondary Indexes Logic
      // 1. Status
      if (existing && existing.status !== product.status) {
          atomic.delete(['tenants', tenantId, 'products_by_status', existing.status, product.id]);
      }
      if (product.status) {
          atomic.set(['tenants', tenantId, 'products_by_status', product.status, product.id], product.id);
      }

      // 2. Category
      if (existing && existing.categoryId !== product.categoryId) {
          if (existing.categoryId) {
             atomic.delete(['tenants', tenantId, 'products_by_category', existing.categoryId, product.id]);
          }
      }
      if (product.categoryId) {
          atomic.set(['tenants', tenantId, 'products_by_category', product.categoryId, product.id], product.id);
      }

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

  const findAll = async (tenantId, { limit = 10, cursor, status, categoryId, search, minPrice, maxPrice } = {}) => {
    return kvPool.withConnection(async (kv) => {
      if (search && !cursor && !status && !categoryId && !minPrice && !maxPrice) {
          const indexRes = await kv.get(['tenants', tenantId, 'products_by_sku', search]);
          if (indexRes.value) {
              const res = await kv.get(['tenants', tenantId, 'products', indexRes.value]);
              if (res.value) {
                  return { items: [res.value], nextCursor: null };
              }
          }
      }

      // Use Secondary Indexes if applicable
      let prefix = ['tenants', tenantId, 'products'];
      let isIndex = false;

      if (status && !search && !minPrice && !maxPrice && !categoryId) {
           prefix = ['tenants', tenantId, 'products_by_status', status];
           isIndex = true;
      } else if (categoryId && !search && !minPrice && !maxPrice && !status) {
           prefix = ['tenants', tenantId, 'products_by_category', categoryId];
           isIndex = true;
      }

      const iter = kv.list({ prefix }, { cursor });
      const products = [];
      let nextCursor = null;

      const productIds = [];
      const loadedProducts = [];

      for await (const res of iter) {
        if (isIndex) {
            // Collecting IDs for batch fetch
            productIds.push(res.value);
            if (productIds.length >= limit) {
                nextCursor = iter.cursor;
                break;
            }
        } else {
            // Fallback: Scanning all products
            const product = res.value;
            let match = true;

            if (status && product.status !== status) match = false;
            if (categoryId && product.categoryId !== categoryId) match = false;
            if (match && minPrice !== undefined && product.price < minPrice) match = false;
            if (match && maxPrice !== undefined && product.price > maxPrice) match = false;

            if (match && search) {
                const searchTerm = search.toLowerCase();
                const inName = product.name?.toLowerCase().includes(searchTerm);
                const inSku = product.sku?.toLowerCase().includes(searchTerm);
                const inId = product.id?.toLowerCase().includes(searchTerm);
                if (!inName && !inSku && !inId) match = false;
            }

            if (match) loadedProducts.push(product);
            if (loadedProducts.length >= limit) {
                 nextCursor = iter.cursor;
                 break;
            }
        }
      }

      if (isIndex && productIds.length > 0) {
          const keys = productIds.map(id => ['tenants', tenantId, 'products', id]);
          const results = await kv.getMany(keys);
          return { items: results.map(r => r.value).filter(p => p !== null), nextCursor };
      }

      return { items: loadedProducts, nextCursor };
    });
  };

  return { save, findById, findByIds, findBySku, findAll, getWithVersion };
};
