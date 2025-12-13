import { Ok, Err } from '../../../../../lib/trust/index.js';

export const createListUsers = ({ userRepository }) => {
  const execute = async (tenantId, { limit, cursor, search } = {}) => {
    return await userRepository.list(tenantId, { limit, cursor, search });
  };
  return { execute };
};
