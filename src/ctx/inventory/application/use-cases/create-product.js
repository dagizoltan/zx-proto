import { createProduct } from '../../domain/entities/product.js';

export const createCreateProduct = ({ productRepository, obs, eventBus }) => {
  const execute = async (tenantId, data) => {
    const product = createProduct({
      id: crypto.randomUUID(),
      ...data
    });

    await productRepository.save(tenantId, product);

    // Publish event
    if (eventBus) {
        await eventBus.publish('product.created', product);
    }

    return product;
  };

  return { execute };
};
