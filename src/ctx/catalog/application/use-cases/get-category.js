import { isErr } from '../../../../../lib/trust/index.js';

export const createGetCategory = ({ categoryRepository }) => {
    const execute = async (tenantId, categoryId) => {
        const res = await categoryRepository.findById(tenantId, categoryId);
        if (isErr(res)) return res;
        return res;
    };
    return { execute };
};
