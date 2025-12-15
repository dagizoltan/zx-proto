import { Hono } from 'hono';
import { createShipmentSelectionHandler } from '../../handlers/shipment/create-shipment-selection.handler.js';
import { listShipmentsHandler } from '../../handlers/shipment/list-shipments.handler.js';
import { shipmentDetailHandler } from '../../handlers/shipment/shipment-detail.handler.js';

export const shipmentRoutes = new Hono();

// New Shipment (Select Order)
shipmentRoutes.get('/new', createShipmentSelectionHandler);

// List Shipments
shipmentRoutes.get('/', listShipmentsHandler);

// Shipment Detail
shipmentRoutes.get('/:id', shipmentDetailHandler);
