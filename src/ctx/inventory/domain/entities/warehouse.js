export const createWarehouse = ({ id, name, address, tenantId }) => ({
  id,
  tenantId,
  name,
  address,
  zones: [], // List of Zone IDs or objects
  createdAt: new Date().toISOString(),
});

export const createZone = ({ id, warehouseId, name, type }) => ({
  id,
  warehouseId,
  name,
  type, // 'picking', 'bulk', 'receiving', 'shipping'
});

export const createBin = ({ id, zoneId, code, capacity }) => ({
  id,
  zoneId,
  code, // e.g. "A-01-01"
  capacity,
});
