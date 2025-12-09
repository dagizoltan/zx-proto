import { Hono } from 'hono';
import * as handlers from '../../handlers/shipment.handlers.js';

export const shipmentRoutes = new Hono();

// New Shipment (Select Order)
shipmentRoutes.get('/new', handlers.createShipmentSelectionHandler);

// List Shipments
shipmentRoutes.get('/', handlers.listShipmentsHandler);

// Shipment Detail
shipmentRoutes.get('/:id', handlers.shipmentDetailHandler);
