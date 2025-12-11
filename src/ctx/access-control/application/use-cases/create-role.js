import { createRole } from '../../domain/entities/role.js';
import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createCreateRole = ({ roleRepository, obs, eventBus }) => {
  const execute = async (tenantId, { name, permissions }) => {
    // Validation handled by Schema in repo, but basic check is fine
    if (!name) return Err({ code: 'VALIDATION_ERROR', message: "Role name is required" });

    const role = createRole({
      id: crypto.randomUUID(),
      name,
      permissions
    });

    const saveRes = await roleRepository.save(tenantId, role);
    if (isErr(saveRes)) return saveRes;

    if (obs) obs.audit('Role created', {
        tenantId,
        roleId: role.id,
        name,
        action: 'CREATE',
        resource: 'Role',
        resourceId: role.id
    });

    if (eventBus) {
        await eventBus.publish('access_control.role_created', {
            id: role.id,
            name: role.name,
            tenantId
        });
    }

    return Ok(role);
  };
  return { execute };
};
