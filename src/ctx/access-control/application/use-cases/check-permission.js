import { checkUserPermission } from '../../domain/services/rbac-service.js';
import { DomainError } from '../../domain/errors/domain-errors.js';
import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createCheckPermission = ({ userRepository, roleRepository }) => {
  const execute = async (tenantId, userId, resource, action) => {
    try {
      // 1. Fetch data (Application Layer responsibility)
      const userRes = await userRepository.findById(tenantId, userId);
      if (isErr(userRes)) return userRes;

      const user = userRes.value;
      if (!user) return Err({ code: 'USER_NOT_FOUND', message: 'User not found' });

      // 2. Fetch roles
      // Handle case where user has no roles
      if (!user.roleIds || user.roleIds.length === 0) {
          return Ok(false);
      }

      const rolesRes = await roleRepository.findByIds(tenantId, user.roleIds);
      if (isErr(rolesRes)) return rolesRes;

      const roles = rolesRes.value;

      // 3. Call pure domain service
      const hasPermission = checkUserPermission(user, roles, resource, action);

      return Ok(hasPermission);
    } catch (error) {
      if (error instanceof DomainError) {
        return Err({ code: error.code, message: error.message });
      }
      return Err({ code: 'PERMISSION_CHECK_ERROR', message: error.message });
    }
  };

  return { execute };
};
