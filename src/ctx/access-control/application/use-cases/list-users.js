import { Ok, Err } from '../../../../../lib/trust/index.js';

export const createListUsers = ({ userRepository }) => {
  const execute = async (tenantId, options = {}) => {
    return await userRepository.query(tenantId, options);
  };
  return { execute };
};
