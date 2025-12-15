import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createGetRole = ({ roleRepository }) => {
    const execute = async (tenantId, roleId) => {
        const res = await roleRepository.findById(tenantId, roleId);
        if (isErr(res)) return res;
        return res;
    };
    return { execute };
};
