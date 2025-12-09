import { createUser } from '../../domain/entities/user.js';

export const createRegisterUser = ({ userRepository, authService, obs, eventBus }) => {
  const execute = async (tenantId, { email, password, name }) => {
    const existing = await userRepository.findByEmail(tenantId, email);
    if (existing) {
      throw new Error('User already exists');
    }

    const passwordHash = await authService.hashPassword(password);

    const user = createUser({
      id: crypto.randomUUID(),
      email,
      passwordHash,
      name,
      roleIds: [], // Default no roles
    });

    await userRepository.save(tenantId, user);

    if (obs) obs.audit('User registered', {
        tenantId,
        userId: user.id,
        userEmail: user.email,
        action: 'REGISTER',
        resource: 'User',
        resourceId: user.id
    });

    if (eventBus) {
        await eventBus.publish('access_control.user_registered', {
            id: user.id,
            name: user.name,
            email: user.email,
            tenantId
        });
    }

    return user;
  };

  return { execute };
};
