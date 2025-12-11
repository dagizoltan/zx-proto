import { createUser } from '../../domain/entities/user.js';
import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createRegisterUser = ({ userRepository, authService, obs, eventBus }) => {
  const execute = async (tenantId, { email, password, name }) => {
    // 1. Check uniqueness using Index Query
    const queryRes = await userRepository.queryByIndex(tenantId, 'email', email);
    if (isErr(queryRes)) return queryRes;

    if (queryRes.value.items.length > 0) {
      return Err({ code: 'CONFLICT', message: 'User already exists' });
    }

    // 2. Hash Password (authService might throw? Assume it returns promise string for now)
    // TODO: Ideally AuthService should return Result too, but it's a domain service wrapper.
    const passwordHash = await authService.hashPassword(password);

    // 3. Create Entity
    const user = createUser({
      id: crypto.randomUUID(),
      email,
      passwordHash,
      name,
      roleIds: [],
    });

    // 4. Save
    const saveRes = await userRepository.save(tenantId, user);
    if (isErr(saveRes)) return saveRes;

    // 5. Side Effects (Fire & Forget or Await?)
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

    return Ok(user);
  };

  return { execute };
};
