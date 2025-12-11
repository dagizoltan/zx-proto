import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createAssignRoleToUser = ({ userRepository, roleRepository, obs }) => {
  const execute = async (tenantId, { userId, roleIds }) => {
    // 1. Fetch User
    const userRes = await userRepository.findById(tenantId, userId);
    if (isErr(userRes)) return userRes; // NotFound or Error

    const user = userRes.value;

    // 2. Verify roles exist
    // We can use findByIds for batch check if repo supports it (Trust Core does)
    const rolesRes = await roleRepository.findByIds(tenantId, roleIds);
    if (isErr(rolesRes)) return rolesRes;

    const foundRoles = rolesRes.value;
    if (foundRoles.length !== roleIds.length) {
         return Err({ code: 'NOT_FOUND', message: 'One or more roles not found' });
    }

    // 3. Update User
    const updatedUser = {
        ...user,
        roleIds
    };

    const saveRes = await userRepository.save(tenantId, updatedUser);
    if (isErr(saveRes)) return saveRes;

    if (obs) obs.audit('User roles updated', { userId, roleIds });

    return Ok(updatedUser);
  };
  return { execute };
};
