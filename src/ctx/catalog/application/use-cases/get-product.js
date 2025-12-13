import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createGetProduct = ({ productRepository, pricingService }) => {
    const execute = async (tenantId, productId, { quantity = 1, customerGroup = null } = {}) => {
        const res = await productRepository.findById(tenantId, productId);
        if (isErr(res)) return res;

        const product = res.value;
        if (!product) return Err({ code: 'NOT_FOUND', message: 'Product not found' });

        // Calculate dynamic price
        // Note: pricingService.calculatePrice should be pure domain service, accepting product & context
        const { price, appliedRule } = pricingService.calculatePrice(product, quantity, customerGroup);

        return Ok({
            ...product,
            finalPrice: price,
            basePrice: product.price,
            appliedRule
        });
    };
    return { execute };
};
