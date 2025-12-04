import { createProduct as createProductEntity, ProductSchema } from '../../domain/entities/product.js';

export const createCreateProduct = ({ productRepository, obs, eventBus }) => {
    const execute = async (tenantId, productData) => {
        // Validation using Zod Schema (Domain Entity)
        const product = createProductEntity({
            id: crypto.randomUUID(),
            tenantId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...productData
        });

        // If Variant, validate parent
        if (product.type === 'VARIANT') {
            if (!product.parentId) throw new Error('Variant must have a parentId');
            const parent = await productRepository.findById(tenantId, product.parentId);
            if (!parent) throw new Error('Parent product not found');
            if (parent.type !== 'CONFIGURABLE') throw new Error('Parent must be CONFIGURABLE');
        }

        await productRepository.save(tenantId, product);

        if (eventBus) {
            await eventBus.publish('catalog.product_created', { ...product, tenantId });
        }

        return product;
    };

    return { execute };
};
