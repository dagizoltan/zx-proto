import { Ok, isErr } from '../../../../../lib/trust/index.js';

export const createGetFeed = ({ feedRepository }) => {
    return async (tenantId, options = {}) => {
        const res = await feedRepository.query(tenantId, options);
        if (isErr(res)) return { items: [] };
        return res.value;
    };
};
