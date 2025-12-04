import { createListProducts, createSearchProducts, createFilterByCategory } from './application/use-cases/catalog-use-cases.js';
import { createCreateProduct } from './application/use-cases/create-product.js';
import { createPricingService } from './domain/services/pricing-service.js';

export const createCatalogContext = async (deps) => {
    const { inventory, obs, messaging } = deps;
    const { eventBus } = messaging || {};
    const productRepository = inventory.repositories.product; // Shared for now

    // Domain Services
    const pricingService = createPricingService();

    // Use Cases
    const listProducts = createListProducts({ productRepository });
    const searchProducts = createSearchProducts({ productRepository });
    const filterByCategory = createFilterByCategory({ productRepository });
    const createProduct = createCreateProduct({ productRepository, obs, eventBus });

    // Stub for featured products
    const getFeaturedProducts = {
        execute: async (tenantId) => listProducts.execute(tenantId, 1, 5)
    };

    // Get Product (with Pricing logic)
    const getProduct = {
        execute: async (tenantId, productId, { quantity = 1, customerGroup = null } = {}) => {
            const product = await productRepository.findById(tenantId, productId);
            if (!product) return null;

            // Calculate dynamic price
            const { price, appliedRule } = pricingService.calculatePrice(product, quantity, customerGroup);
            return {
                ...product,
                finalPrice: price,
                basePrice: product.price,
                appliedRule
            };
        }
    };

    return {
        name: 'catalog',
        services: {
            pricingService
        },
        useCases: {
            listProducts,
            searchProducts,
            filterByCategory,
            getFeaturedProducts,
            createProduct,
            getProduct
        }
    };
};
