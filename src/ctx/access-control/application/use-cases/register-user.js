import { createUser } from '../../domain/entities/user.js';
import { DomainError } from '../../domain/errors/domain-errors.js';
import { Ok, Err, isErr } from '../../../../../lib/trust/index.js';

export const createRegisterUser = ({ userRepository, authService, obs, eventBus }) => {
  const execute = async (tenantId, { email, password, name }) => {
    try {
        // 1. Domain Validation & Entity Creation
        // Note: Password hashing is infrastructure, but required for entity creation.
        // We do it before entity creation to ensure we have a valid hash.
        const passwordHash = await authService.hashPassword(password);

        const user = createUser({
            id: crypto.randomUUID(),
            email,
            passwordHash,
            name,
            roleIds: [],
        });

        // 2. Check uniqueness (I/O)
        // Using the new findByEmail method from the port
        const existingRes = await userRepository.findByEmail(tenantId, user.email);
        if (isErr(existingRes)) return existingRes;

        if (existingRes.value) {
            return Err({ code: 'CONFLICT', message: 'User already exists' });
        }

        // 3. Save
        const saveRes = await userRepository.save(tenantId, user);
        if (isErr(saveRes)) return saveRes;

        // 4. Side Effects
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

    } catch (error) {
        if (error instanceof DomainError) {
            return Err({ code: error.code, message: error.message });
        }
        return Err({ code: 'REGISTRATION_ERROR', message: error.message });
    }
  };

  return { execute };
};
