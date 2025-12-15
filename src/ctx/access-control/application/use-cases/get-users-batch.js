import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createGetUsersBatch = ({ userRepository }) => {
    const execute = async (tenantId, userIds) => {
        try {
            const res = await userRepository.findByIds(tenantId, userIds);
            if (isErr(res)) return res;
            return res;
        } catch (error) {
            return Err({ code: 'GET_USERS_BATCH_ERROR', message: error.message });
        }
    };
    return { execute };
};
