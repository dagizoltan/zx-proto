// Catalog repository could be a search index or just a view on products.
// For now, wrapping the KV product repo or assuming we have a separate one.

export const createListProducts = ({ productRepository }) => {
    const execute = async (tenantId, page = 1, limit = 20) => {
        // Naive implementation: fetch all and slice.
        // KV list is ordered by key.
        // ProductRepo.findAll returns { items, nextCursor }.
        const { items } = await productRepository.findAll(tenantId);
        const start = (page - 1) * limit;
        return items.slice(start, start + limit);
    };
    return { execute };
};

export const createSearchProducts = ({ productRepository }) => {
    const execute = async (tenantId, query) => {
        const { items } = await productRepository.findAll(tenantId);
        const lowerQ = query.toLowerCase();
        return items.filter(p => p.name.toLowerCase().includes(lowerQ) || p.description?.toLowerCase().includes(lowerQ));
    };
    return { execute };
};

export const createFilterByCategory = ({ productRepository }) => {
    const execute = async (tenantId, category) => {
        const { items } = await productRepository.findAll(tenantId);
        return items.filter(p => p.category === category);
    };
    return { execute };
}
