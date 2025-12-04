export const createKVProductRepository = (kvPool) => {
  const save = async (tenantId, product) => {
    return kvPool.withConnection(async (kv) => {
      // Index by ID
      await kv.set(['tenants', tenantId, 'products', product.id], product);
      return product;
    });
  };

  const findById = async (tenantId, id) => {
    return kvPool.withConnection(async (kv) => {
      const res = await kv.get(['tenants', tenantId, 'products', id]);
      return res.value;
    });
  };

  const findAll = async (tenantId, { limit = 10, cursor, status, search, minPrice, maxPrice } = {}) => {
    return kvPool.withConnection(async (kv) => {
      // Streaming filter implementation
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

      // If loop finished without breaking, it means we scanned everything
      // and nextCursor remains null (or we can use iter.cursor if needed, but Deno KV behavior varies)
      // Usually if loop finishes, there is no next cursor.

      return {
          items: products,
          nextCursor
      };
    });
  };

  return { save, findById, findAll };
};
