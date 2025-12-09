
export const createListAuditLogs = ({ auditRepository }) => {
  const execute = async (tenantId, { limit = 50, cursor, userId, action, resource } = {}) => {
    // Assuming repository supports these filters or we filter in-memory as seen in other repos
    return await auditRepository.findAll(tenantId, { limit, cursor, userId, action, resource });
  };
  return { execute };
};
