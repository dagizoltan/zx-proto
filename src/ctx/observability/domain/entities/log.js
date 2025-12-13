export const createLog = ({ id, tenantId, service, level, message, meta = {}, timestamp }) => {
  if (!id) throw new Error("Log ID is required");
  if (!level) throw new Error("Log level is required");
  if (!message) throw new Error("Log message is required");

  return Object.freeze({
    id,
    tenantId,
    service: service || 'system',
    level,
    message,
    meta,
    timestamp: timestamp || new Date().toISOString()
  });
};
