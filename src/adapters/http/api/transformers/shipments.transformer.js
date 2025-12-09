/**
 * Shipment Transformers
 */

export const toApiShipment = (shipment) => ({
    id: shipment.id,
    orderId: shipment.orderId,
    carrier: shipment.carrier,
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    items: shipment.items,
    createdAt: shipment.createdAt
});
