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
  userId,
  timestamp
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
  timestamp: timestamp || new Date().toISOString(),
});
