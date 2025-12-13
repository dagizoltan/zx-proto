export const createActivity = ({ id, tenantId, userId, action, resource, resourceId, meta = {}, timestamp }) => {
  if (!id) throw new Error("Activity ID is required");
  if (!userId) throw new Error("User ID is required");
  if (!action) throw new Error("Action is required");

  return Object.freeze({
    id,
    tenantId,
    userId,
    action,
    resource,
    resourceId,
    meta,
    timestamp: timestamp || new Date().toISOString()
  });
};
