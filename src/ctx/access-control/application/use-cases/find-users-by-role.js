export const createFindUsersByRole = ({ userRepository }) => {
  const execute = async (tenantId, roleId, options = {}) => {
    return await userRepository.findByRole(tenantId, roleId, options);
  };
  return { execute };
};
