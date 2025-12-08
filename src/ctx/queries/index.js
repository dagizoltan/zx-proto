import { createGetCustomerProfile } from './application/use-cases/get-customer-profile.js';

export const createQueriesContext = async (deps) => {
    const { registry, obs } = deps;

    const getCustomerProfile = createGetCustomerProfile({
        registry,
        obs
    });

    return {
        name: 'queries',
        useCases: {
            getCustomerProfile
        }
    };
};
