import { isErr } from '../../../../../lib/trust/index.js';

export const createGetPriceList = ({ priceListRepository }) => {
    const execute = async (tenantId, priceListId) => {
        const res = await priceListRepository.findById(tenantId, priceListId);
        if (isErr(res)) return res;
        return res;
    };
    return { execute };
};
