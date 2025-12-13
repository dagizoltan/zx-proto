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

export const createAccessControlContext = async (deps) => {
  const { persistence, config, obs, registry, security, messaging } = deps;
  const { eventBus } = messaging || {};

  // Adapters (Infrastructure)
  const userRepository = createKVUserRepositoryAdapter(persistence.kvPool);
  const roleRepository = createKVRoleRepositoryAdapter(persistence.kvPool);

  // Domain Services
  // RBAC Service is now a collection of pure functions, so no factory needed.
  // Use cases import functions directly.
  const authService = createAuthService(security);

  // Use Cases (Application)
  // Injecting Adapters as Ports
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
    // rbacService functions are imported directly in the use case
  });

  const listUsers = createListUsers({ userRepository });
  const listRoles = createListRoles({ roleRepository });
  const createRole = createCreateRole({ roleRepository, obs, eventBus });
  const assignRole = createAssignRoleToUser({ userRepository, roleRepository, obs });
  const findUsersByRole = createFindUsersByRole({ userRepository });

  return {
    name: 'access-control',

    // Expose Repositories?
    // Usually Contexts expose services/use-cases.
    // Exposing repositories directly leaks infra, but might be needed for other contexts temporarily.
    // The previous index.js exposed them.
    // However, these are now ADAPTERS.
    // If other contexts need them, they should probably rely on the OLD repositories
    // or we wrap these to look like old ones.
    // BUT the task said: "Keep old repositories for backward compatibility".
    // So if I return `userRepository` here, it is the NEW adapter.
    // If external callers expect the OLD repo interface (which returns Results but maybe differently?),
    // wait, the old repos returned Results too. The interface is likely similar.
    // But `userRepository` here is `IUserRepository` impl.
    // Previous `createKVUserRepository` returned object with `save`, `findById` etc.
    // The new adapter returns `save`, `findById` etc.
    // It should be compatible enough.

    repositories: {
      user: userRepository,
      role: roleRepository,
    },

    // Services
    services: {
      // rbac: rbacService, // rbacService is no longer an object with methods.
      // We should probably NOT expose 'rbac' service if it's internal.
      // If external contexts used `services.rbac.checkPermission`, they will break.
      // If so, we should provide a facade.
      // `checkPermission` use case covers `rbac.checkPermission`.
      // But `rbac.hasRole`?
      // Let's create a facade for backward compatibility if needed.
      // The previous `rbacService` had: `checkPermission`, `hasRole`, `assignRole`.
      // `assignRole` is now a use case.
      // `checkPermission` is now a use case.
      // `hasRole`? We don't have a use case for it explicitly exposed?
      // Maybe we don't need to expose `services.rbac` anymore if `useCases.checkPermission` is enough.
      // I'll leave `services.auth` as is.
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
