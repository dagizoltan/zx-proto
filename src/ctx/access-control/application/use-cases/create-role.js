import { createRole } from '../../domain/entities/role.js';

export const createCreateRole = ({ roleRepository, obs, eventBus }) => {
  const execute = async (tenantId, { name, permissions }) => {
    // Simple validation could be added here
    if (!name) throw new Error("Role name is required");

    const role = createRole({
      id: crypto.randomUUID(),
      name,
      permissions
    });

    await roleRepository.save(tenantId, role);

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

    return role;
  };
  return { execute };
};
