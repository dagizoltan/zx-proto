export const createRBACService = (userRepository, roleRepository) => {
  const checkPermission = async (tenantId, userId, resource, action) => {
    const user = await userRepository.findById(tenantId, userId);
    if (!user) return false;

    // If no roles, no access
    if (!user.roleIds || user.roleIds.length === 0) return false;

    // Fixed N+1: Use batch fetch
    const roles = await roleRepository.findByIds(tenantId, user.roleIds);

    return roles.some(role =>
      role && role.permissions && role.permissions.some(p =>
        p.resource === resource && p.actions.includes(action)
      )
    );
  };

  const hasRole = async (tenantId, userId, roleName) => {
    const user = await userRepository.findById(tenantId, userId);
    if (!user) return false;

    const roles = await roleRepository.findByIds(tenantId, user.roleIds);

    return roles.some(role => role && role.name === roleName);
  };

  const assignRole = async (tenantId, userId, roleId) => {
    const user = await userRepository.findById(tenantId, userId);
    if (!user) throw new Error('User not found');

    if (user.roleIds.includes(roleId)) {
      return user;
    }

    const updatedUser = {
      ...user,
      roleIds: [...user.roleIds, roleId],
    };

    await userRepository.save(tenantId, updatedUser);
    return updatedUser;
  };

  return { checkPermission, hasRole, assignRole };
};
