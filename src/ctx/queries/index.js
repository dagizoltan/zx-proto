import { createGetCustomerProfile } from './application/use-cases/get-customer-profile.js';
import { createGetDashboardStats } from './application/use-cases/get-dashboard-stats.js';

export const createQueriesContext = async (deps) => {
    const { registry, obs, config } = deps;

    const getCustomerProfile = createGetCustomerProfile({
        registry,
        obs
    });

    const getDashboardStats = createGetDashboardStats({
        registry,
        config
    });

    return {
        name: 'queries',
        useCases: {
            getCustomerProfile,
            getDashboardStats
        }
    };
};
