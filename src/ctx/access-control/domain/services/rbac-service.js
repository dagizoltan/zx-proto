export const createRBACService = (userRepository, roleRepository) => {
  const checkPermission = async (userId, resource, action) => {
    const user = await userRepository.findById(userId);
    if (!user) return false;

    // If no roles, no access
    if (!user.roleIds || user.roleIds.length === 0) return false;

    const roles = await Promise.all(
      user.roleIds.map(id => roleRepository.findById(id))
    );

    return roles.some(role =>
      role && role.permissions && role.permissions.some(p =>
        p.resource === resource && p.actions.includes(action)
      )
    );
  };

  const hasRole = async (userId, roleName) => {
    const user = await userRepository.findById(userId);
    if (!user) return false;

    const roles = await Promise.all(
      user.roleIds.map(id => roleRepository.findById(id))
    );

    return roles.some(role => role && role.name === roleName);
  };

  const assignRole = async (userId, roleId) => {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    if (user.roleIds.includes(roleId)) {
      return user;
    }

    const updatedUser = {
      ...user,
      roleIds: [...user.roleIds, roleId],
    };

    await userRepository.save(updatedUser);
    return updatedUser;
  };

  return { checkPermission, hasRole, assignRole };
};
