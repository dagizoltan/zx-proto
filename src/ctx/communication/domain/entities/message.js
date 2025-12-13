export const createMessage = ({ id, tenantId, conversationId, senderId, content, createdAt }) => {
  if (!id) throw new Error("Message ID is required");
  if (!conversationId) throw new Error("Conversation ID is required");
  if (!content) throw new Error("Content is required");

  return Object.freeze({
    id,
    tenantId,
    conversationId,
    senderId,
    content,
    createdAt: createdAt || new Date().toISOString()
  });
};
