import { isErr } from '../../../../../lib/trust/index.js';

export const createListWarehouses = ({ warehouseRepository }) => {
    const execute = async (tenantId, { limit = 100, cursor } = {}) => {
        return await warehouseRepository.list(tenantId, { limit, cursor });
    };
    return { execute };
};
