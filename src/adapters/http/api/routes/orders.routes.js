import { Hono } from 'hono';
import { validateRequest, validateQuery } from '../middleware/validation-middleware.js';
import {
  createOrderSchema,
  listOrdersQuerySchema
} from '../validators/orders.validator.js';
import {
  listOrdersHandler,
  createOrderHandler
} from '../handlers/orders/index.js';
import { authMiddleware } from '../middleware/auth-middleware.js';

export const ordersRoutes = new Hono();

// Apply Auth Middleware
ordersRoutes.use('*', authMiddleware);

ordersRoutes.get(
  '/',
  validateQuery(listOrdersQuerySchema),
  listOrdersHandler
);

ordersRoutes.post(
  '/',
  validateRequest(createOrderSchema),
  createOrderHandler
);
