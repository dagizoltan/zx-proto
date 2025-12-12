import { Ok, Err, isErr, unwrap } from '../../../../../lib/trust/index.js';

export const createListProducts = ({ productRepository, categoryRepository, priceListRepository }) => {
    // Unified List/Search/Filter Use Case
    const execute = async (tenantId, { limit = 20, cursor, status, search, categoryId, minPrice, maxPrice, populate = [] } = {}) => {
        // Construct Filter
        const filter = {};
        if (status) filter.status = status;
        if (categoryId) filter.category = categoryId; // Matches 'category' index in repo
        if (search) filter.search = search;
        if (minPrice !== undefined) filter.price_min = minPrice;
        if (maxPrice !== undefined) filter.price_max = maxPrice;

        // Construct Resolvers
        const resolvers = {
            category: (ids) => categoryRepository.findByIds(tenantId, ids),
        };

        // Define Search Fields for Products
        const searchFields = ['name', 'sku', 'description'];

        return productRepository.query(tenantId, { limit, cursor, filter, populate, searchFields }, { resolvers });
    };
    return { execute };
};

export const createSearchProducts = ({ productRepository }) => {
    return {
        execute: async (tenantId, query) => {
             const uc = createListProducts({ productRepository });
             const res = await uc.execute(tenantId, { search: query, limit: 50 });
             if (isErr(res)) return res;
             return Ok(res.value.items);
        }
    };
};

export const createFilterByCategory = ({ productRepository }) => {
    return {
         execute: async (tenantId, categoryId) => {
             const uc = createListProducts({ productRepository });
             const res = await uc.execute(tenantId, { categoryId, limit: 50 });
             if (isErr(res)) return res;
             return Ok(res.value.items);
         }
    };
}
