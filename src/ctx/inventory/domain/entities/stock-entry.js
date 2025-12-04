export const createStockEntry = ({
  id,
  tenantId,
  productId,
  locationId,
  quantity,
  reservedQuantity = 0,
  batchId
}) => ({
  id,
  tenantId,
  productId,
  locationId,
  quantity,
  reservedQuantity,
  batchId,
  updatedAt: new Date().toISOString(),
});

export const availableStock = (entry) => entry.quantity - entry.reservedQuantity;
