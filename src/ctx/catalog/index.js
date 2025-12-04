import { createListProducts, createSearchProducts, createFilterByCategory } from './application/use-cases/catalog-use-cases.js';

export const createCatalogContext = async (deps) => {
    // Catalog relies on Inventory for product data in this simple monolith
    const { registry } = deps;

    // We need to access the product repository.
    // Ideally Catalog has its own Read Model, but we can access Inventory's repo for now via registry?
    // Registry returns contexts. Inventory context exposes repositories.

    // BUT `initialize` calls factory with resolved dependencies.
    // `createCatalogContext` in bootstrap depends on `domain.inventory`.
    // So `deps.inventory` should be available if we registered it that way.
    // Looking at bootstrap plan: `ctx.registerDomain('catalog', createCatalogContext, [..., 'domain.inventory'])`
    // So `deps.inventory` is the inventory context instance.

    const inventory = deps.inventory;
    const productRepository = inventory.repositories.product;

    const listProducts = createListProducts({ productRepository });
    const searchProducts = createSearchProducts({ productRepository });
    const filterByCategory = createFilterByCategory({ productRepository });

    // Stub for featured products
    const getFeaturedProducts = {
        execute: async (tenantId) => listProducts.execute(tenantId, 1, 5)
    };

    return {
        name: 'catalog',
        useCases: {
            listProducts,
            searchProducts,
            filterByCategory,
            getFeaturedProducts
        }
    };
};
