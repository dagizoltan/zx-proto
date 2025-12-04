import { createProduct } from '../../domain/entities/product.js';

export const createCreateProduct = ({ productRepository, obs, eventBus }) => {
  const execute = async (data) => {
    const product = createProduct({
      id: crypto.randomUUID(),
      ...data
    });

    await productRepository.save(product);

    // Publish event
    if (eventBus) {
        await eventBus.publish('product.created', product);
    }

    return product;
  };

  return { execute };
};
