export const createCheckPermission = ({ rbacService }) => {
  const execute = async (tenantId, userId, resource, action) => {
    return await rbacService.checkPermission(tenantId, userId, resource, action);
  };

  return { execute };
};
