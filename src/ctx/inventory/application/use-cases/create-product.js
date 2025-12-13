import { createProduct } from '../../domain/entities/product.js';
import { isErr } from '../../../../../lib/trust/index.js';

export const createCreateProduct = ({ productRepository, obs, eventBus }) => {
  const execute = async (tenantId, data) => {

    const product = createProduct({
      id: crypto.randomUUID(),
      ...data
    });

    const result = await productRepository.save(tenantId, product);

    if (isErr(result)) {
        throw new Error(`Failed to create product: ${result.error.message}`);
    }

    // Publish event
    if (eventBus) {
        await eventBus.publish('product.created', product);
    }

    return product;
  };

  return { execute };
};
