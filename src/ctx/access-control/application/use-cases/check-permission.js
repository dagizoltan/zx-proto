export const createCheckPermission = ({ rbacService }) => {
  const execute = async (userId, resource, action) => {
    return await rbacService.checkPermission(userId, resource, action);
  };

  return { execute };
};
