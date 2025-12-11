import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createLoginUser = ({ userRepository, authService, obs }) => {
  const execute = async (tenantId, email, password) => {
    // 1. Find User by Email
    const queryRes = await userRepository.queryByIndex(tenantId, 'email', email);
    if (isErr(queryRes)) return queryRes;

    if (queryRes.value.items.length === 0) {
      // Don't reveal user existence
      return Err({ code: 'AUTH_FAILED', message: 'Invalid credentials' });
    }

    const user = queryRes.value.items[0];

    // 2. Verify Password
    const isValid = await authService.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return Err({ code: 'AUTH_FAILED', message: 'Invalid credentials' });
    }

    // 3. Generate Token
    const token = await authService.generateToken({
      id: user.id,
      email: user.email,
      roleIds: user.roleIds
    });

    return Ok({ user, token });
  };

  return { execute };
};
