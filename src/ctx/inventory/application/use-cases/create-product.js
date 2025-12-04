import { createProduct } from '../../domain/entities/product.js';
import { createProductSchema } from '../schema.js';

export const createCreateProduct = ({ productRepository, obs, eventBus }) => {
  const execute = async (tenantId, data) => {
    const validated = createProductSchema.parse(data);

    const product = createProduct({
      id: crypto.randomUUID(),
      ...validated
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
