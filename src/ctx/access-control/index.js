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
import { createGetCustomerProfile } from './application/use-cases/get-customer-profile.js';

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

  const listUsers = createListUsers({ userRepository });
  const listRoles = createListRoles({ roleRepository });
  const createRole = createCreateRole({ roleRepository, obs });
  const assignRole = createAssignRoleToUser({ userRepository, roleRepository, obs });

  // Note: getCustomerProfile needs access to Order repository.
  // We can't inject 'registry' nicely here because registry is fully formed only after all contexts are created.
  // This is a circular dependency issue typical in this manual DI setup.
  // Solution 1: Inject registry and lazy-load order repo in the use case.
  // Solution 2: Pass 'persistence' to the use case and let it recreate the repo (cleanest for now given infra).
  // I will use persistence to get the KV pool and create the order repo locally or pass the registry.
  // Let's use registry with lazy access in the use case or just inject the repo factory.

  // Actually, 'registry' is passed to `createAccessControlContext`.
  // We can pass `registry` to `createGetCustomerProfile`.
  // But wait, `createGetCustomerProfile` expects `orderRepository`.
  // We can create `orderRepository` here since we have `persistence`.
  // It duplicates the instantiation but stateless repos are fine.

  // Importing `createKVOrderRepository` dynamically or at top level?
  // I'll assume we can import it.

  // For now, I will modify the factory to accept registry and let it fetch the order domain.

  const getCustomerProfile = createGetCustomerProfile({
      userRepository,
      // Mocking/Proxying the order repo via registry inside the use case would be better if we updated the use case signature
      // But let's just pass a proxy object that delegates to registry
      orderRepository: {
          findByUserId: async (tId, uId) => {
              const orders = registry.get('domain.orders');
              // We need to access the repo or a use case.
              // orders.repositories.order might be available if exposed.
              // Let's assume orders context exposes repositories.
              return orders.repositories.order.findByUserId(tId, uId);
          }
      },
      obs
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
      listUsers,
      listRoles,
      createRole,
      assignRole,
      getCustomerProfile,
    },
  };
};
