// Stock repository essentially manages the quantity part of products or separate stock entries.
// For simplicity in this demo, we might just update the product entity or have a separate stock key.
// Given the requirements mention "Stock" entity, let's assume a separate or merged concept.
// The `product.js` entity has `quantity`. So we can use ProductRepo for stock updates, OR extract it.
// The prompt has `kv-stock-repository.js`. I will implement it as a specialized view or helper on the same data or separate data.
// Let's assume separate data for high throughput stock updates to avoid contention on full product details?
// Or just reuse product for now as "Monolith KV" style.
// Let's stick to Product having quantity for simplicity, but StockRepository interface.

export const createKVStockRepository = (kvPool) => {
  const getStock = async (productId) => {
    return kvPool.withConnection(async (kv) => {
      const res = await kv.get(['products', productId]);
      return res.value ? res.value.quantity : 0;
    });
  };

  const updateStock = async (productId, newQuantity) => {
     return kvPool.withConnection(async (kv) => {
      const res = await kv.get(['products', productId]);
      if (!res.value) throw new Error('Product not found');

      const product = res.value;
      const updated = { ...product, quantity: newQuantity, updatedAt: new Date().toISOString() };
      await kv.set(['products', productId], updated);
      return updated;
    });
  };

  return { getStock, updateStock };
};
