import { createCreateProduct } from './application/use-cases/create-product.js';
import { createGetProduct } from './application/use-cases/get-product.js';
import { createListProducts, createSearchProducts, createFilterByCategory } from './application/use-cases/catalog-use-cases.js';
import { createPricingService } from './domain/services/pricing-service.js';

import { createKVCategoryRepositoryAdapter } from './infrastructure/adapters/kv-category-repository.adapter.js';
import { createKVPriceListRepositoryAdapter } from './infrastructure/adapters/kv-price-list-repository.adapter.js';
import { createKVProductRepositoryAdapter } from './infrastructure/adapters/kv-product-repository.adapter.js';

import { createCreateCategory } from './application/use-cases/create-category.js';
import { createListCategories } from './application/use-cases/list-categories.js';
import { createCreatePriceList } from './application/use-cases/create-price-list.js';
import { createListPriceLists } from './application/use-cases/list-price-lists.js';

/**
 * Catalog Context Factory
 *
 * @param {Object} deps - Explicit Dependency Injection
 * @param {Object} deps.kvPool - KV Connection Pool
 * @param {Object} deps.eventBus - Event Bus
 * @param {Object} deps.obs - Observability Service
 */
export const createCatalogContext = async ({ kvPool, eventBus, obs }) => {

    // Adapters (Catalog owns its data now)
    const productRepository = createKVProductRepositoryAdapter(kvPool);
    const categoryRepository = createKVCategoryRepositoryAdapter(kvPool);
    const priceListRepository = createKVPriceListRepositoryAdapter(kvPool);

    // Domain Services
    const pricingService = createPricingService();

    // Use Cases
    const listProducts = createListProducts({
        productRepository,
        categoryRepository,
        priceListRepository
    });

    const searchProducts = createSearchProducts({ productRepository });
    const filterByCategory = createFilterByCategory({ productRepository });

    const createProduct = createCreateProduct({
        productRepository,
        categoryRepository,
        obs,
        eventBus
    });

    const getProduct = createGetProduct({
        productRepository,
        pricingService
    });

    const createCategory = createCreateCategory({ categoryRepository });
    const listCategories = createListCategories({ categoryRepository });
    const createPriceList = createCreatePriceList({ priceListRepository });
    const listPriceLists = createListPriceLists({ priceListRepository });

    const getFeaturedProducts = {
        execute: async (tenantId) => listProducts.execute(tenantId, 1, 5)
    };

    return {
        name: 'catalog',
        services: {
            pricingService
        },
        repositories: {
            category: categoryRepository,
            priceList: priceListRepository,
            product: productRepository
        },
        useCases: {
            listProducts,
            searchProducts,
            filterByCategory,
            getFeaturedProducts,
            createProduct,
            getProduct,
            createCategory,
            listCategories,
            createPriceList,
            listPriceLists
        }
    };
};
