import { isErr } from '../../../../../lib/trust/index.js';

export const createListLocations = ({ locationRepository, warehouseRepository }) => {
    const execute = async (tenantId, { limit = 100, cursor, populate = [] } = {}) => {
        const resolvers = {};
        if (populate.includes('warehouse')) {
            resolvers.warehouse = (ids) => warehouseRepository.findByIds(tenantId, ids);
        }
        // Add other resolvers if needed

        return await locationRepository.query(tenantId, { limit, cursor, populate }, { resolvers });
    };
    return { execute };
};
