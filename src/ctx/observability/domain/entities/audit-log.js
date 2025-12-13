export const createAuditLog = ({ id, tenantId, userId, action, resource, resourceId, details, ipAddress, timestamp }) => {
    if (!id) throw new Error("Audit Log ID is required");
    if (!action) throw new Error("Action is required");
    if (!resource) throw new Error("Resource is required");
    return Object.freeze({
        id, tenantId, userId, action, resource, resourceId, details, ipAddress,
        timestamp: timestamp || new Date().toISOString()
    });
};
