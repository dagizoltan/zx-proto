import { createUser } from '../../domain/entities/user.js';

export const createRegisterUser = ({ userRepository, authService, obs }) => {
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

    return user;
  };

  return { execute };
};
