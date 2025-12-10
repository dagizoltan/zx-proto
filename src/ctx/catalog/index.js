import { createListProducts, createSearchProducts, createFilterByCategory } from './application/use-cases/catalog-use-cases.js';
import { createCreateProduct } from './application/use-cases/create-product.js';
import { createPricingService } from './domain/services/pricing-service.js';

// New Imports
import { createKVCategoryRepository } from '../../infra/persistence/kv/repositories/kv-category-repository.js';
import { createKVPriceListRepository } from '../../infra/persistence/kv/repositories/kv-price-list-repository.js';
import { createCreateCategory } from './application/use-cases/create-category.js';
import { createListCategories } from './application/use-cases/list-categories.js';
import { createCreatePriceList } from './application/use-cases/create-price-list.js';
import { createListPriceLists } from './application/use-cases/list-price-lists.js';


export const createCatalogContext = async (deps) => {
    const { inventory, obs, messaging, persistence } = deps; // persistence needed for new repos
    const { eventBus } = messaging || {};
    const productRepository = inventory.repositories.product; // Shared for now

    // Instantiate new Repositories
    const categoryRepository = createKVCategoryRepository(persistence.kvPool);
    const priceListRepository = createKVPriceListRepository(persistence.kvPool);

    // Domain Services
    const pricingService = createPricingService();

    // Use Cases
    const listProducts = createListProducts({ productRepository });
    const searchProducts = createSearchProducts({ productRepository });
    const filterByCategory = createFilterByCategory({ productRepository });
    const createProduct = createCreateProduct({
        productRepository,
        categoryRepository,
        obs,
        eventBus
    });

    // New Use Cases
    const createCategory = createCreateCategory({ categoryRepository });
    const listCategories = createListCategories({ categoryRepository });
    const createPriceList = createCreatePriceList({ priceListRepository });
    const listPriceLists = createListPriceLists({ priceListRepository });

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
        repositories: {
            category: categoryRepository,
            priceList: priceListRepository
        },
        useCases: {
            listProducts,
            searchProducts,
            filterByCategory,
            getFeaturedProducts,
            createProduct,
            getProduct,
            // New exports
            createCategory,
            listCategories,
            createPriceList,
            listPriceLists
        }
    };
};
