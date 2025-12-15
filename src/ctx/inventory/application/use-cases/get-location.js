import { isErr } from '../../../../../lib/trust/index.js';

export const createGetLocation = ({ locationRepository }) => {
    const execute = async (tenantId, locationId) => {
        const res = await locationRepository.findById(tenantId, locationId);
        if (isErr(res)) return res;
        return res;
    };
    return { execute };
};
