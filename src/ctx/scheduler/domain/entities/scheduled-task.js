
export const createScheduledTask = (data) => {
  const {
    id,
    handlerKey, // The unique code identifier (e.g., 'system.cleanup_audit_logs')
    name,
    description,
    cronExpression, // standard cron string
    enabled = true,
    lastRunAt = null,
    nextRunAt = null,
    status = 'IDLE', // IDLE, RUNNING
    createdAt = new Date(),
    updatedAt = new Date(),
  } = data;

  return Object.freeze({
    id,
    handlerKey,
    name,
    description,
    cronExpression,
    enabled,
    lastRunAt: lastRunAt ? new Date(lastRunAt) : null,
    nextRunAt: nextRunAt ? new Date(nextRunAt) : null,
    status,
    createdAt: new Date(createdAt),
    updatedAt: new Date(updatedAt),

    toJSON: () => ({
      id,
      handlerKey,
      name,
      description,
      cronExpression,
      enabled,
      lastRunAt: lastRunAt ? new Date(lastRunAt).toISOString() : null,
      nextRunAt: nextRunAt ? new Date(nextRunAt).toISOString() : null,
      status,
      createdAt: new Date(createdAt).toISOString(),
      updatedAt: new Date(updatedAt).toISOString(),
    }),
  });
};
