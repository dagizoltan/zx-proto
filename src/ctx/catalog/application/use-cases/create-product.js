import { createProduct as createProductEntity, validateVariantAgainstParent } from '../../domain/entities/product.js';
import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createCreateProduct = ({ productRepository, categoryRepository, obs, eventBus }) => {
    const execute = async (tenantId, productData) => {

        // 1. Validate Category ID
        if (productData.categoryId) {
            const catRes = await categoryRepository.findById(tenantId, productData.categoryId);
            if (isErr(catRes)) {
                 return Err({ code: 'VALIDATION_ERROR', message: `Category ${productData.categoryId} not found` });
            }
        }

        // 2. Create Entity
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
            const parentRes = await productRepository.findById(tenantId, product.parentId);
            if (isErr(parentRes)) return Err({ code: 'VALIDATION_ERROR', message: 'Parent product not found' });

            const parent = parentRes.value;

            // Domain Purity: Logic moved to Entity
            const valRes = validateVariantAgainstParent(product, parent);
            if (isErr(valRes)) return valRes;
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
