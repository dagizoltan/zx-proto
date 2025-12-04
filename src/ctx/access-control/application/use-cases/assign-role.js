export const createAssignRoleToUser = ({ userRepository, roleRepository, obs }) => {
  const execute = async (tenantId, { userId, roleIds }) => {
    const user = await userRepository.findById(tenantId, userId);
    if (!user) throw new Error("User not found");

    // Verify roles exist
    for (const roleId of roleIds) {
        const role = await roleRepository.findById(tenantId, roleId);
        if (!role) throw new Error(`Role ${roleId} not found`);
    }

    const updatedUser = {
        ...user,
        roleIds
    };

    await userRepository.save(tenantId, updatedUser);

    if (obs) obs.audit('User roles updated', { userId, roleIds });

    return updatedUser;
  };
  return { execute };
};
