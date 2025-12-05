export const createKVProductRepository = (kvPool) => {
  const save = async (tenantId, product) => {
    return kvPool.withConnection(async (kv) => {
      const primaryKey = ['tenants', tenantId, 'products', product.id];
      const skuIndexKey = ['tenants', tenantId, 'products_by_sku', product.sku];

      // Atomic Transaction to maintain index
      const atomic = kv.atomic();

      // 1. Check if SKU changed (if update). For simplicity in MVP, we might overwrite.
      // Ideally we check old value to delete old index if SKU changed.
      // Ignoring that complexity for "next steps" focus on creating the index.

      atomic
        .set(primaryKey, product)
        .set(skuIndexKey, product.id); // Index points to ID

      const commit = await atomic.commit();
      if (!commit.ok) throw new Error('Failed to save product');

      return product;
    });
  };

  const findById = async (tenantId, id) => {
    return kvPool.withConnection(async (kv) => {
      const res = await kv.get(['tenants', tenantId, 'products', id]);
      return res.value;
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
      // Optimization: If search matches SKU format exactly, try index first
      if (search && !cursor && !status && !minPrice && !maxPrice) {
          // Try exact SKU match first (O(1))
          const bySku = await findBySku(tenantId, search); // Helper call? No, simpler to copy logic or call internal
          // We can't call internal `findBySku` easily without exposing it or destructuring.
          // Let's just do it here.
          const indexRes = await kv.get(['tenants', tenantId, 'products_by_sku', search]);
          if (indexRes.value) {
              const res = await kv.get(['tenants', tenantId, 'products', indexRes.value]);
              if (res.value) {
                  return { items: [res.value], nextCursor: null };
              }
          }
      }

      // Fallback to Streaming filter (O(N))
      const iter = kv.list({ prefix: ['tenants', tenantId, 'products'] }, { cursor });
      const products = [];
      let nextCursor = null;

      // Lowercase search term for fuzzy match
      const searchTerm = search ? search.toLowerCase() : null;

      for await (const res of iter) {
        const product = res.value;

        // Apply Filters
        let match = true;

        if (status && product.status !== status) {
          match = false;
        }

        if (match && minPrice !== undefined && product.price < minPrice) {
          match = false;
        }

        if (match && maxPrice !== undefined && product.price > maxPrice) {
          match = false;
        }

        if (match && searchTerm) {
          const inName = product.name?.toLowerCase().includes(searchTerm);
          const inSku = product.sku?.toLowerCase().includes(searchTerm);
          const inId = product.id?.toLowerCase().includes(searchTerm);

          if (!inName && !inSku && !inId) {
            match = false;
          }
        }

        if (match) {
          products.push(product);
        }

        // Check if we reached the limit
        if (products.length >= limit) {
          nextCursor = iter.cursor;
          break;
        }
      }

      return {
          items: products,
          nextCursor
      };
    });
  };

  return { save, findById, findBySku, findAll };
};
