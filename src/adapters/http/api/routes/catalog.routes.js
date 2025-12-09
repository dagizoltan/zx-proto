import { Hono } from 'hono';
import { validateRequest, validateQuery } from '../middleware/validation-middleware.js';
import {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema
} from '../validators/catalog.validator.js';
import {
  listProductsHandler,
  getProductHandler,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler
} from '../handlers/catalog/index.js';

export const catalogRoutes = new Hono();

// Products
catalogRoutes.get(
  '/products',
  validateQuery(listProductsQuerySchema),
  listProductsHandler
);

catalogRoutes.post(
  '/products',
  validateRequest(createProductSchema),
  createProductHandler
);

catalogRoutes.get(
  '/products/:id',
  getProductHandler
);

catalogRoutes.put(
  '/products/:id',
  validateRequest(updateProductSchema),
  updateProductHandler
);

catalogRoutes.delete(
  '/products/:id',
  deleteProductHandler
);

// Categories (Placeholder)
catalogRoutes.get('/categories', (c) => c.json({ items: [] }));

// Price Lists (Placeholder)
catalogRoutes.get('/price-lists', (c) => c.json({ items: [] }));
