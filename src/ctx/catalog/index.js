import { createListProducts, createSearchProducts, createFilterByCategory } from './application/use-cases/catalog-use-cases.js';
import { createCreateProduct } from './application/use-cases/create-product.js';
import { createPricingService } from './domain/services/pricing-service.js';

// New Imports
import { createKVCategoryRepository } from '../../infra/persistence/kv/repositories/kv-category-repository.js';
import { createKVPriceListRepository } from '../../infra/persistence/kv/repositories/kv-price-list-repository.js';
import { createKVProductRepository } from '../../infra/persistence/kv/repositories/kv-product-repository.js';

import { createCreateCategory } from './application/use-cases/create-category.js';
import { createListCategories } from './application/use-cases/list-categories.js';
import { createCreatePriceList } from './application/use-cases/create-price-list.js';
import { createListPriceLists } from './application/use-cases/list-price-lists.js';
import { Ok, Err, isErr } from '../../../lib/trust/index.js';


export const createCatalogContext = async (deps) => {
    const { inventory, obs, messaging, persistence } = deps;
    const { eventBus } = messaging || {};

    let productRepository = inventory.repositories.product;

    // Instantiate new Repositories
    const categoryRepository = createKVCategoryRepository(persistence.kvPool);
    const priceListRepository = createKVPriceListRepository(persistence.kvPool);

    // Domain Services
    const pricingService = createPricingService();

    // Use Cases
    // Inject categoryRepository and priceListRepository into listProducts
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

    const createCategory = createCreateCategory({ categoryRepository });
    const listCategories = createListCategories({ categoryRepository });
    const createPriceList = createCreatePriceList({ priceListRepository });
    const listPriceLists = createListPriceLists({ priceListRepository });

    const getFeaturedProducts = {
        execute: async (tenantId) => listProducts.execute(tenantId, 1, 5)
    };

    // Get Product (with Pricing logic)
    const getProduct = {
        execute: async (tenantId, productId, { quantity = 1, customerGroup = null } = {}) => {
            const res = await productRepository.findById(tenantId, productId);
            if (isErr(res)) return res; // NotFound or Error

            const product = res.value;

            // Calculate dynamic price (pricingService is sync and domain pure)
            const { price, appliedRule } = pricingService.calculatePrice(product, quantity, customerGroup);

            return Ok({
                ...product,
                finalPrice: price,
                basePrice: product.price,
                appliedRule
            });
        }
    };

    return {
        name: 'catalog',
        services: {
            pricingService
        },
        repositories: {
            category: categoryRepository, // Exposed for resolvers via c.ctx.get('domain.catalog').repositories.category
            priceList: priceListRepository,
            product: productRepository // Expose product repo via catalog too if needed
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
