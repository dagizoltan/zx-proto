import { isErr } from '../../../../../lib/trust/index.js';

export const createQueryStockMovements = ({ stockMovementRepository, catalogGateway, locationRepository, batchRepository }) => {
    const execute = async (tenantId, { limit = 50, cursor, search } = {}) => {
        const resolvers = {
            product: (ids) => catalogGateway.getProducts(tenantId, ids), // Assumes catalogGateway has getProducts (batch)
            location: (ids) => locationRepository.findByIds(tenantId, ids),
            fromLocation: (ids) => locationRepository.findByIds(tenantId, ids),
            toLocation: (ids) => locationRepository.findByIds(tenantId, ids),
            batch: (ids) => batchRepository.findByIds(tenantId, ids)
        };

        const options = {
            limit,
            cursor,
            populate: ['product', 'location', 'fromLocation', 'toLocation', 'batch']
        };

        if (search) {
            options.filter = { search };
            options.searchFields = ['referenceId', 'type'];
        }

        return await stockMovementRepository.query(tenantId, options, { resolvers });
    };
    return { execute };
};
