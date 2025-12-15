import { isErr } from '../../../../../lib/trust/index.js';

export const createGetWarehouse = ({ warehouseRepository }) => {
    const execute = async (tenantId, warehouseId) => {
        const res = await warehouseRepository.findById(tenantId, warehouseId);
        if (isErr(res)) return res;
        return res;
    };
    return { execute };
};
