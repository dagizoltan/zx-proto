import { createUser } from '../../domain/entities/user.js';
import { DomainError } from '../../domain/errors/domain-errors.js';
import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createAssignRoleToUser = ({ userRepository, roleRepository, obs }) => {
  const execute = async (tenantId, { userId, roleIds }) => {
    try {
        // 1. Fetch User
        const userRes = await userRepository.findById(tenantId, userId);
        if (isErr(userRes)) return userRes; // NotFound or Error

        const user = userRes.value;
        if (!user) return Err({ code: 'USER_NOT_FOUND', message: 'User not found' });

        // 2. Verify roles exist
        // We can use findByIds for batch check if repo supports it (Trust Core does)
        const rolesRes = await roleRepository.findByIds(tenantId, roleIds);
        if (isErr(rolesRes)) return rolesRes;

        const foundRoles = rolesRes.value;
        // Check if all requested roleIds were found.
        // Note: foundRoles might contain nulls or be shorter depending on implementation.
        // Assuming findByIds returns only found items or array of same length with nulls.
        // Trust Platform `findByIds` usually returns found items.
        // Let's assume strict check:
        const foundIds = foundRoles.map(r => r.id);
        const allFound = roleIds.every(id => foundIds.includes(id));

        if (!allFound) {
            return Err({ code: 'ROLE_NOT_FOUND', message: 'One or more roles not found' });
        }

        // 3. Update User Entity
        // We need to re-create the user entity to validate invariants if we were modifying other props,
        // but here we are just updating roleIds.
        // Ideally we should have a domain method `assignRoles(user, roleIds)`.
        // For now, spreading and creating new object is fine, but we should use `createUser` to validate.
        const updatedUser = createUser({
            ...user,
            roleIds
        });

        const saveRes = await userRepository.save(tenantId, updatedUser);
        if (isErr(saveRes)) return saveRes;

        if (obs) obs.audit('User roles updated', {
            tenantId,
            userId,
            roleIds,
            action: 'UPDATE_ROLES',
            resource: 'User',
            resourceId: userId
        });

        return Ok(updatedUser);
    } catch (error) {
        if (error instanceof DomainError) {
            return Err({ code: error.code, message: error.message });
        }
        return Err({ code: 'ASSIGN_ROLE_ERROR', message: error.message });
    }
  };
  return { execute };
};
