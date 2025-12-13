import { createRole } from '../../domain/entities/role.js';
import { DomainError } from '../../domain/errors/domain-errors.js';
import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createCreateRole = ({ roleRepository, obs, eventBus }) => {
  const execute = async (tenantId, { name, permissions }) => {
    try {
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
    } catch (error) {
        if (error instanceof DomainError) {
            return Err({ code: error.code, message: error.message });
        }
        return Err({ code: 'CREATE_ROLE_ERROR', message: error.message });
    }
  };
  return { execute };
};
