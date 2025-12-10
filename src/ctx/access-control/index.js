import { createKVUserRepository } from '../../infra/persistence/kv/repositories/kv-user-repository.js';
import { createKVRoleRepository } from '../../infra/persistence/kv/repositories/kv-role-repository.js';
import { createRBACService } from './domain/services/rbac-service.js';
import { createAuthService } from './domain/services/auth-service.js';
import { createLoginUser } from './application/use-cases/login-user.js';
import { createRegisterUser } from './application/use-cases/register-user.js';
import { createCheckPermission } from './application/use-cases/check-permission.js';
import { createListUsers } from './application/use-cases/list-users.js';
import { createListRoles } from './application/use-cases/list-roles.js';
import { createCreateRole } from './application/use-cases/create-role.js';
import { createAssignRoleToUser } from './application/use-cases/assign-role.js';
import { createFindUsersByRole } from './application/use-cases/find-users-by-role.js';

export const createAccessControlContext = async (deps) => {
  const { persistence, config, obs, registry, security, messaging } = deps;
  const { eventBus } = messaging || {};

  // Repositories
  const userRepository = createKVUserRepository(persistence.kvPool);
  const roleRepository = createKVRoleRepository(persistence.kvPool);

  // Domain Services
  const rbacService = createRBACService(userRepository, roleRepository);
  const authService = createAuthService(security);

  // Use Cases
  const loginUser = createLoginUser({
    userRepository,
    authService,
    obs,
  });

  const registerUser = createRegisterUser({
    userRepository,
    authService,
    obs,
    eventBus
  });

  const checkPermission = createCheckPermission({
    rbacService,
    obs,
  });

  const listUsers = createListUsers({ userRepository });
  const listRoles = createListRoles({ roleRepository });
  const createRole = createCreateRole({ roleRepository, obs, eventBus });
  const assignRole = createAssignRoleToUser({ userRepository, roleRepository, obs });
  const findUsersByRole = createFindUsersByRole({ userRepository });

  return {
    name: 'access-control',

    // Repositories
    repositories: {
      user: userRepository,
      role: roleRepository,
    },

    // Services
    services: {
      rbac: rbacService,
      auth: authService,
    },

    // Use Cases
    useCases: {
      loginUser,
      registerUser,
      checkPermission,
      listUsers,
      listRoles,
      createRole,
      assignRole,
      findUsersByRole,
    },
  };
};
