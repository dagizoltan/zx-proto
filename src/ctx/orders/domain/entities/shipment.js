export const createShipment = ({
  id,
  tenantId,
  orderId,
  code,
  carrier,
  trackingNumber,
  items,
  status = 'SHIPPED',
  shippedAt,
  createdAt
}) => {
  if (!id) throw new Error("Shipment ID is required");
  if (!orderId) throw new Error("Order ID is required");
  if (!items || !items.length) throw new Error("Shipment must have items");

  return Object.freeze({
    id,
    tenantId,
    orderId,
    code,
    carrier,
    trackingNumber,
    items,
    status,
    shippedAt,
    createdAt: createdAt || new Date().toISOString(),
  });
};
