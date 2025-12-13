export const createNotification = ({ id, tenantId, userId, title, message, level, link, read = false, createdAt }) => {
  if (!id) throw new Error("Notification ID is required");
  if (!userId) throw new Error("User ID is required");
  if (!title) throw new Error("Title is required");

  return Object.freeze({
    id,
    tenantId,
    userId,
    title,
    message,
    level,
    link,
    read,
    createdAt: createdAt || new Date().toISOString()
  });
};
