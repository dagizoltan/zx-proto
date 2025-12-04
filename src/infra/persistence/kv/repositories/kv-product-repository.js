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

  const findAll = async (tenantId) => {
    return kvPool.withConnection(async (kv) => {
      const iter = kv.list({ prefix: ['tenants', tenantId, 'products'] });
      const products = [];
      for await (const res of iter) {
        products.push(res.value);
      }
      return products;
    });
  };

  return { save, findById, findAll };
};
