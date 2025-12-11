import { Ok, Err } from '../../../../../lib/trust/index.js';

export const createListUsers = ({ userRepository }) => {
  const execute = async (tenantId, { limit, cursor, search } = {}) => {
    // Repository.findAll is actually list() now returning Result
    return await userRepository.findAll(tenantId, { limit, cursor, search });
  };
  return { execute };
};
