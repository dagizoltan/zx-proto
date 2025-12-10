import { createProduct as createProductEntity, ProductSchema } from '../../domain/entities/product.js';

export const createCreateProduct = ({ productRepository, categoryRepository, obs, eventBus }) => {
    const execute = async (tenantId, productData) => {

        // Validate Category ID
        if (productData.categoryId) {
            if (!categoryRepository) throw new Error('Category Repository not available');
            const cat = await categoryRepository.findById(tenantId, productData.categoryId);
            if (!cat) throw new Error(`Category ${productData.categoryId} not found`);
        }

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

            // Validate attributes
            const requiredAttrs = parent.configurableAttributes || [];
            const variantAttrs = product.variantAttributes || {};

            for (const attr of requiredAttrs) {
                if (!variantAttrs[attr]) {
                    throw new Error(`Variant is missing required attribute: ${attr}`);
                }
            }
        }

        await productRepository.save(tenantId, product);

        if (eventBus) {
            await eventBus.publish('catalog.product_created', { ...product, tenantId });
        }

        return product;
    };

    return { execute };
};
