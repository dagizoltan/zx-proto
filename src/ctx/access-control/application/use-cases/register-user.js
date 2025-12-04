import { createUser } from '../../domain/entities/user.js';

export const createRegisterUser = ({ userRepository, authService, obs }) => {
  const execute = async ({ email, password, name }) => {
    const existing = await userRepository.findByEmail(email);
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

    await userRepository.save(user);

    return user;
  };

  return { execute };
};
