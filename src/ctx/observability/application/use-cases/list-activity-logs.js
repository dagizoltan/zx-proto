export const createListActivityLogs = ({ activityRepository }) => {
    return {
        execute: async (tenantId, { limit, cursor }) => {
            return await activityRepository.list(tenantId, { limit, cursor });
        }
    };
};
