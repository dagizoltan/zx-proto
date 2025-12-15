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
import { createGetUser } from './application/use-cases/get-user.js';
import { resolveDependencies } from '../../utils/registry/dependency-resolver.js';
import { createContextBuilder } from '../../utils/registry/context-builder.js';

export const createAccessControlContext = async (deps) => {
  const { kvPool, security, eventBus, obs } = resolveDependencies(deps, {
    kvPool: ['persistence.kvPool', 'kvPool'],
    security: ['infra.security', 'security'],
    eventBus: ['messaging.eventBus', 'eventBus'],
    obs: ['infra.obs', 'obs']
  });

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
  const getUser = createGetUser({ userRepository });

  // Alias for compatibility with orders context which expects getCustomer
  const getCustomer = getUser;

  return createContextBuilder('access-control')
    .withRepositories({
      user: userRepository,
      role: roleRepository,
    })
    .withServices({
      auth: authService,
    })
    .withUseCases({
      loginUser,
      registerUser,
      checkPermission,
      listUsers,
      listRoles,
      createRole,
      assignRole,
      findUsersByRole,
      getUser,
      getCustomer
    })
    .build();
};

export const AccessControlContext = {
    name: 'access-control',
    dependencies: [
        'infra.persistence',
        'infra.obs',
        'infra.security',
        'infra.messaging'
    ],
    factory: createAccessControlContext
};
