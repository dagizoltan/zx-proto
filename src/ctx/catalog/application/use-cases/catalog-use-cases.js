// Catalog repository could be a search index or just a view on products.
// For now, wrapping the KV product repo or assuming we have a separate one.
// The prompt shows `kv-search-index.js` in `infra/persistence/kv/`.
// I will implement a simple list/search using the product repository for now.

export const createListProducts = ({ productRepository }) => {
    const execute = async (tenantId, page = 1, limit = 20) => {
        // Naive implementation: fetch all and slice.
        // KV list is ordered by key.
        // ProductRepo.findAll returns all.
        const all = await productRepository.findAll(tenantId);
        const start = (page - 1) * limit;
        return all.slice(start, start + limit);
    };
    return { execute };
};

export const createSearchProducts = ({ productRepository }) => {
    const execute = async (tenantId, query) => {
        const all = await productRepository.findAll(tenantId);
        const lowerQ = query.toLowerCase();
        return all.filter(p => p.name.toLowerCase().includes(lowerQ) || p.description?.toLowerCase().includes(lowerQ));
    };
    return { execute };
};

export const createFilterByCategory = ({ productRepository }) => {
    const execute = async (tenantId, category) => {
        const all = await productRepository.findAll(tenantId);
        return all.filter(p => p.category === category);
    };
    return { execute };
}
