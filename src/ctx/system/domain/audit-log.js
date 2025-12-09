export const AuditLog = ({
  id,
  tenantId,
  userId,
  userEmail, // Snapshot in case user is deleted
  action, // CREATE, UPDATE, DELETE, READ (maybe filtered)
  resource, // 'products', 'orders', etc.
  resourceId,
  details = {}, // JSON diff or metadata
  timestamp = new Date(),
  ip = null,
  userAgent = null
}) => {
  return Object.freeze({
    id,
    tenantId,
    userId,
    userEmail,
    action,
    resource,
    resourceId,
    details,
    timestamp,
    ip,
    userAgent
  });
};
