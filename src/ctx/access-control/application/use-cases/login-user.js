export const createLoginUser = ({ userRepository, authService, obs }) => {
  const execute = async (tenantId, email, password) => {
    const user = await userRepository.findByEmail(tenantId, email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await authService.verifyPassword(password, user.passwordHash);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = await authService.generateToken({
      id: user.id,
      email: user.email,
      roleIds: user.roleIds
    });

    return { user, token };
  };

  return { execute };
};
