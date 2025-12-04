import { createKVUserRepository } from '../../infra/persistence/kv/repositories/kv-user-repository.js';
import { createKVRoleRepository } from '../../infra/persistence/kv/repositories/kv-role-repository.js';
import { createRBACService } from './domain/services/rbac-service.js';
import { createAuthService } from './domain/services/auth-service.js';
import { createLoginUser } from './application/use-cases/login-user.js';
import { createRegisterUser } from './application/use-cases/register-user.js';
import { createCheckPermission } from './application/use-cases/check-permission.js';

export const createAccessControlContext = async (deps) => {
  const { persistence, config, obs, registry, security } = deps;

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
  });

  const checkPermission = createCheckPermission({
    rbacService,
    obs,
  });

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
    },
  };
};
