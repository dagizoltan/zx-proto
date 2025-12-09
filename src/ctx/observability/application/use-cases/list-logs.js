export const createListLogs = ({ logRepository }) => {
    return {
        execute: async (tenantId, { level, limit, cursor }) => {
            return await logRepository.list(tenantId, { level, limit, cursor });
        }
    };
};
