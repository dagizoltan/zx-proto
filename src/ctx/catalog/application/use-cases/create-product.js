import { createProduct as createProductEntity } from '../../domain/entities/product.js';
import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createCreateProduct = ({ productRepository, categoryRepository, obs, eventBus }) => {
    const execute = async (tenantId, productData) => {

        // 1. Validate Category ID
        if (productData.categoryId) {
            // Note: categoryRepository.findById now returns Result
            const catRes = await categoryRepository.findById(tenantId, productData.categoryId);
            if (isErr(catRes)) {
                 // Map NOT_FOUND to VALIDATION_ERROR for clarity?
                 // Or just propagate.
                 // Legacy behavior was throw "not found".
                 return Err({ code: 'VALIDATION_ERROR', message: `Category ${productData.categoryId} not found` });
            }
        }

        // 2. Create Entity
        // Zod validation inside createProductEntity might throw?
        // Ideally we catch it.
        let product;
        try {
            product = createProductEntity({
                id: crypto.randomUUID(),
                tenantId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ...productData
            });
        } catch (e) {
            return Err({ code: 'VALIDATION_ERROR', message: e.message, issues: e.issues });
        }

        // 3. Variant Validation
        if (product.type === 'VARIANT') {
            if (!product.parentId) return Err({ code: 'VALIDATION_ERROR', message: 'Variant must have a parentId' });

            const parentRes = await productRepository.findById(tenantId, product.parentId);
            if (isErr(parentRes)) return Err({ code: 'VALIDATION_ERROR', message: 'Parent product not found' });

            const parent = parentRes.value;
            if (parent.type !== 'CONFIGURABLE') return Err({ code: 'VALIDATION_ERROR', message: 'Parent must be CONFIGURABLE' });

            const requiredAttrs = parent.configurableAttributes || [];
            const variantAttrs = product.variantAttributes || {};

            for (const attr of requiredAttrs) {
                if (!variantAttrs[attr]) {
                    return Err({ code: 'VALIDATION_ERROR', message: `Variant is missing required attribute: ${attr}` });
                }
            }
        }

        // 4. Save
        const saveRes = await productRepository.save(tenantId, product);
        if (isErr(saveRes)) return saveRes;

        if (eventBus) {
            await eventBus.publish('catalog.product_created', { ...product, tenantId });
        }

        return Ok(product);
    };

    return { execute };
};
