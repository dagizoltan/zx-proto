export const createKVProductRepository = (kvPool) => {
  const save = async (product) => {
    return kvPool.withConnection(async (kv) => {
      // Index by ID and SKU (if needed, but mainly ID)
      await kv.set(['products', product.id], product);
      return product;
    });
  };

  const findById = async (id) => {
    return kvPool.withConnection(async (kv) => {
      const res = await kv.get(['products', id]);
      return res.value;
    });
  };

  const findAll = async () => {
    return kvPool.withConnection(async (kv) => {
      const iter = kv.list({ prefix: ['products'] });
      const products = [];
      for await (const res of iter) {
        products.push(res.value);
      }
      return products;
    });
  };

  return { save, findById, findAll };
};
