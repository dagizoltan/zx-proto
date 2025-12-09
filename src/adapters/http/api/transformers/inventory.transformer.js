/**
 * Inventory Transformers
 */

export const toApiWarehouse = (wh) => ({
    id: wh.id,
    name: wh.name,
    address: wh.address,
    description: wh.description
});

export const toApiLocation = (loc) => ({
    id: loc.id,
    warehouseId: loc.warehouseId,
    name: loc.name,
    type: loc.type
});

export const toApiStockEntry = (entry) => ({
    id: entry.id,
    productId: entry.productId,
    locationId: entry.locationId,
    batchId: entry.batchId,
    quantity: entry.quantity,
    reservedQuantity: entry.reservedQuantity,
    available: entry.quantity - (entry.reservedQuantity || 0)
});
