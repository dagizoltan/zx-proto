export const NotificationLevel = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS',
  DEBUG: 'DEBUG'
};

export const Notification = ({
  id,
  tenantId,
  userId, // Optional: Target specific user
  level,
  title,
  message,
  read = false,
  createdAt = new Date(),
  link = null // Optional: Clickable action
}) => {
  if (!Object.values(NotificationLevel).includes(level)) {
    throw new Error(`Invalid notification level: ${level}`);
  }

  return Object.freeze({
    id,
    tenantId,
    userId,
    level,
    title,
    message,
    read,
    createdAt,
    link,
    // Helper to serialize for API
    toJSON: () => ({
      id,
      level,
      title,
      message,
      read,
      createdAt: createdAt.toISOString(),
      link
    })
  });
};
