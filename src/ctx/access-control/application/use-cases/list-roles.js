export const createListRoles = ({ roleRepository }) => {
  const execute = async (tenantId) => {
    return await roleRepository.findAll(tenantId);
  };
  return { execute };
};
