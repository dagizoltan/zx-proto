export const createListAuditLogs = ({ auditRepository }) => {
    return {
        execute: async (tenantId, { limit, cursor }) => {
            return await auditRepository.list(tenantId, { limit, cursor });
        }
    };
};
