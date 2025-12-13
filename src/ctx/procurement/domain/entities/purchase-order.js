export const createPurchaseOrder = ({
  id,
  tenantId,
  supplierId,
  code,
  status = 'DRAFT',
  items = [],
  expectedDate,
  notes,
  totalCost = 0,
  createdAt,
  updatedAt
}) => {
  if (!id) throw new Error("Purchase Order ID is required");
  if (!supplierId) throw new Error("Supplier ID is required");
  if (!code) throw new Error("PO Code is required");

  return Object.freeze({
    id,
    tenantId,
    supplierId,
    code,
    status,
    items, // [{ productId, quantity, unitCost, receivedQuantity }]
    expectedDate,
    notes,
    totalCost,
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: updatedAt || new Date().toISOString(),
  });
};
