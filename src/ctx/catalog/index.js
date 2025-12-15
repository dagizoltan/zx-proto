import { createCreateProduct } from './application/use-cases/create-product.js';
import { createGetProduct } from './application/use-cases/get-product.js';
import { createListProducts, createSearchProducts, createFilterByCategory } from './application/use-cases/catalog-use-cases.js';
import { createPricingService } from './domain/services/pricing-service.js';

import { createKVCategoryRepositoryAdapter } from './infrastructure/adapters/kv-category-repository.adapter.js';
import { createKVPriceListRepositoryAdapter } from './infrastructure/adapters/kv-price-list-repository.adapter.js';
import { createKVProductRepositoryAdapter } from './infrastructure/adapters/kv-product-repository.adapter.js';

import { createCreateCategory } from './application/use-cases/create-category.js';
import { createGetCategory } from './application/use-cases/get-category.js';
import { createListCategories } from './application/use-cases/list-categories.js';
import { createCreatePriceList } from './application/use-cases/create-price-list.js';
import { createGetPriceList } from './application/use-cases/get-price-list.js';
import { createListPriceLists } from './application/use-cases/list-price-lists.js';

import { resolveDependencies } from '../../utils/registry/dependency-resolver.js';
import { createContextBuilder } from '../../utils/registry/context-builder.js';
import { Ok, Err, isErr } from '../../../lib/trust/index.js';

export const createCatalogContext = async (deps) => {
    const { kvPool, eventBus, obs } = resolveDependencies(deps, {
        kvPool: ['persistence.kvPool', 'kvPool'],
        eventBus: ['messaging.eventBus', 'eventBus'],
        obs: ['observability.obs']
    });

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

    // New Use Case for batch retrieval to support auto-gateways
    const getProducts = {
        execute: async (tenantId, productIds) => {
            try {
                const products = [];
                for (const productId of productIds) {
                    const result = await getProduct.execute(tenantId, productId);
                    if (isErr(result)) {
                         return Err({
                            code: 'PRODUCT_NOT_FOUND',
                            message: `Product ${productId} not found`
                         });
                    }
                    products.push(result.value);
                }
                return Ok(products);
            } catch (error) {
                return Err({ code: 'CATALOG_ERROR', message: error.message });
            }
        }
    };

    const createCategory = createCreateCategory({ categoryRepository });
    const getCategory = createGetCategory({ categoryRepository });
    const listCategories = createListCategories({ categoryRepository });
    const createPriceList = createCreatePriceList({ priceListRepository });
    const getPriceList = createGetPriceList({ priceListRepository });
    const listPriceLists = createListPriceLists({ priceListRepository });

    const getFeaturedProducts = {
        execute: async (tenantId) => listProducts.execute(tenantId, 1, 5)
    };

    return createContextBuilder('catalog')
        .withRepositories({
            category: categoryRepository,
            priceList: priceListRepository,
            product: productRepository
        })
        .withServices({
            pricingService
        })
        .withUseCases({
            listProducts,
            searchProducts,
            filterByCategory,
            getFeaturedProducts,
            createProduct,
            getProduct,
            getProducts, // Added for batch support
            createCategory,
            getCategory,
            listCategories,
            createPriceList,
            getPriceList,
            listPriceLists
        })
        .build();
};

export const CatalogContext = {
    name: 'catalog',
    dependencies: [
        'infra.persistence',
        'domain.observability',
        'infra.messaging'
    ],
    factory: createCatalogContext
};
