import { DomainError } from '../errors/domain-errors.js';

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
  if (!id) throw new DomainError("Shipment ID is required", 'INVALID_SHIPMENT_ID');
  if (!orderId) throw new DomainError("Order ID is required", 'INVALID_ORDER_ID');
  if (!items || !items.length) throw new DomainError("Shipment must have items", 'INVALID_ITEMS');

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
