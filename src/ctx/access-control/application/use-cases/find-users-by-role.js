export const createFindUsersByRole = ({ userRepository }) => {
  const execute = async (tenantId, roleId, options = {}) => {
    // Repository.findByRole now returns Result<{ items, nextCursor }>
    return await userRepository.findByRole(tenantId, roleId, options);
  };
  return { execute };
};
