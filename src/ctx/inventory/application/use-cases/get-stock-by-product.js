export const createGetStockByProduct = ({ stockRepository }) => {
    const execute = async (tenantId, productId, options = { limit: 1000 }) => {
        return await stockRepository.queryByIndex(tenantId, 'product', productId, options);
    };
    return { execute };
};
