
// This adapter abstracts the Access Control context to provide identity information
// to the Communication context, decoupling them.

import { isErr, Ok, Err } from '../../../../../lib/trust/index.js';

export const createIdentityAdapter = (accessControlContext) => {
    return {
        getUsersByIds: async (tenantId, userIds) => {
            if (!userIds || userIds.length === 0) return Ok([]);

            // We need to access the repository or service from access-control
            // Assuming accessControlContext exposes repositories or we can use a service
            // Based on previous analysis: ac.repositories.user.findByIds

            const userRepo = accessControlContext.repositories.user;
            if (!userRepo || !userRepo.findByIds) {
                 return Err({ code: 'DEPENDENCY_ERROR', message: 'User repository not found in Access Control' });
            }

            const res = await userRepo.findByIds(tenantId, userIds);
            if (isErr(res)) return res;

            return Ok(res.value.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email
            })));
        }
    };
};
