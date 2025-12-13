export const createConversation = ({ id, tenantId, participantIds = [], lastMessagePreview, updatedAt }) => {
  if (!id) throw new Error("Conversation ID is required");

  return Object.freeze({
    id,
    tenantId,
    participantIds,
    lastMessagePreview,
    updatedAt: updatedAt || new Date().toISOString()
  });
};
