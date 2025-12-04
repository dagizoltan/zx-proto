export const createUpdateStock = ({ productRepository, stockAllocationService, obs, eventBus }) => {
  const execute = async (productId, quantity, reason = 'manual_adjustment') => {
    // We can use stockRepo or productRepo.
    // Since we didn't inject stockRepo in the factory (based on my previous index.js plan),
    // let's assume we can use productRepository or we should update index.js to pass stockRepo.

    // I will use productRepository for direct updates here as it's simpler.
    const product = await productRepository.findById(productId);
    if (!product) throw new Error('Product not found');

    const updated = { ...product, quantity, updatedAt: new Date().toISOString() };
    await productRepository.save(updated);

    if (eventBus) {
        await eventBus.publish('stock.updated', { productId, quantity, reason });
    }

    return updated;
  };

  return { execute };
};
