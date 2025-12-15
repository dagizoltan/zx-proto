export const createListLocationsByWarehouse = ({ locationRepository }) => {
    const execute = async (tenantId, warehouseId, { limit = 1000 } = {}) => {
        return await locationRepository.queryByIndex(tenantId, 'warehouse', warehouseId, { limit });
    };
    return { execute };
};
