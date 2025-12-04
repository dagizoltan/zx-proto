export const createStockMovement = ({
  id,
  tenantId,
  productId,
  quantity,
  type, // 'received', 'shipped', 'allocated', 'adjusted', 'moved'
  fromLocationId, // null for 'received'
  toLocationId,   // null for 'shipped'
  referenceId,    // orderId, shipmentId, adjustmentId
  batchId,
  reason,
  userId
}) => ({
  id,
  tenantId,
  productId,
  quantity,
  type,
  fromLocationId,
  toLocationId,
  referenceId,
  batchId,
  reason,
  userId,
  timestamp: new Date().toISOString(),
});
