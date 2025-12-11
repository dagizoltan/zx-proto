import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createCheckPermission = ({ rbacService }) => {
  const execute = async (tenantId, userId, resource, action) => {
    // rbacService might need refactoring too? Assuming it returns bool
    // If rbacService throws, we should catch it or refactor it.
    // Let's assume we will refactor rbacService next.
    // For now, wrap in try/catch or assume it returns boolean.
    // But this useCase should return Result.

    try {
        const allowed = await rbacService.checkPermission(tenantId, userId, resource, action);
        return Ok(allowed);
    } catch (e) {
        return Err({ code: 'RBAC_ERROR', message: e.message });
    }
  };

  return { execute };
};
