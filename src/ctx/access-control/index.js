import { createKVUserRepositoryAdapter } from './infrastructure/adapters/kv-user-repository.adapter.js';
import { createKVRoleRepositoryAdapter } from './infrastructure/adapters/kv-role-repository.adapter.js';
import { createAuthService } from './domain/services/auth-service.js';
import { createLoginUser } from './application/use-cases/login-user.js';
import { createRegisterUser } from './application/use-cases/register-user.js';
import { createCheckPermission } from './application/use-cases/check-permission.js';
import { createListUsers } from './application/use-cases/list-users.js';
import { createListRoles } from './application/use-cases/list-roles.js';
import { createCreateRole } from './application/use-cases/create-role.js';
import { createAssignRoleToUser } from './application/use-cases/assign-role.js';
import { createFindUsersByRole } from './application/use-cases/find-users-by-role.js';

/**
 * Access Control Context Factory
 *
 * @param {Object} deps - Explicit DI
 * @param {Object} deps.kvPool
 * @param {Object} deps.security
 * @param {Object} deps.eventBus
 * @param {Object} deps.obs
 */
export const createAccessControlContext = async ({ kvPool, security, eventBus, obs }) => {

  // Adapters (Infrastructure)
  const userRepository = createKVUserRepositoryAdapter(kvPool);
  const roleRepository = createKVRoleRepositoryAdapter(kvPool);

  // Domain Services
  const authService = createAuthService(security);

  // Use Cases (Application)
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
    userRepository,
    roleRepository
  });

  const listUsers = createListUsers({ userRepository });
  const listRoles = createListRoles({ roleRepository });
  const createRole = createCreateRole({ roleRepository, obs, eventBus });
  const assignRole = createAssignRoleToUser({ userRepository, roleRepository, obs });
  const findUsersByRole = createFindUsersByRole({ userRepository });

  return {
    name: 'access-control',

    repositories: {
      user: userRepository,
      role: roleRepository,
    },

    services: {
      auth: authService,
    },

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
