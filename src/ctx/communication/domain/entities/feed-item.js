export const createFeedItem = ({ id, tenantId, channelId, content, authorId, type = 'post', createdAt }) => {
  if (!id) throw new Error("Feed Item ID is required");
  if (!channelId) throw new Error("Channel ID is required");
  if (!content) throw new Error("Content is required");

  return Object.freeze({
    id,
    tenantId,
    channelId,
    content,
    authorId,
    type,
    createdAt: createdAt || new Date().toISOString()
  });
};
