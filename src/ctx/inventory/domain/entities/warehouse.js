export const createWarehouse = ({ id, tenantId, name, code, address, createdAt }) => {
  if (!name) throw new Error("Warehouse name is required");
  if (!code) throw new Error("Warehouse code is required");

  return Object.freeze({
    id,
    tenantId,
    name,
    code,
    address,
    createdAt: createdAt || new Date().toISOString(),
  });
};

export const createLocation = ({ id, tenantId, warehouseId, parentId, code, type, capacity, createdAt }) => {
  if (!warehouseId) throw new Error("Location must belong to a warehouse");
  if (!code) throw new Error("Location code is required");
  if (!type) throw new Error("Location type is required");

  return Object.freeze({
    id,
    tenantId,
    warehouseId,
    parentId,
    code,
    type,
    capacity,
    createdAt: createdAt || new Date().toISOString(),
  });
};

export const createBatch = ({ id, tenantId, sku, batchNumber, expiryDate, manufacturingDate, cost, supplierId, receivedAt }) => {
  if (!sku) throw new Error("Batch SKU is required");
  if (!batchNumber) throw new Error("Batch number is required");

  return Object.freeze({
    id,
    tenantId,
    sku,
    batchNumber,
    expiryDate,
    manufacturingDate,
    cost,
    supplierId,
    receivedAt: receivedAt || new Date().toISOString(),
  });
};
