export const createListUsers = ({ userRepository }) => {
  const execute = async (tenantId, { limit, cursor, search } = {}) => {
    return await userRepository.findAll(tenantId, { limit, cursor, search });
  };
  return { execute };
};
