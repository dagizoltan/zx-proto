import { Ok, Err } from '../../../../../lib/trust/index.js';

export const createGetUser = ({ userRepository }) => {
  const execute = async (tenantId, userId) => {
    try {
      const user = await userRepository.findById(tenantId, userId);
      if (!user) {
        return Err({ code: 'USER_NOT_FOUND', message: 'User not found' });
      }
      return Ok(user);
    } catch (error) {
      return Err({ code: 'GET_USER_ERROR', message: error.message });
    }
  };

  return { execute };
};
