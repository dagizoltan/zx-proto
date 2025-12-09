import { Hono } from 'hono';
import { validateRequest, validateQuery } from '../middleware/validation-middleware.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { roleCheckMiddleware } from '../middleware/rbac-middleware.js';
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
  deleteProductHandler,
  listCategoriesHandler,
  listPriceListsHandler
} from '../handlers/catalog/index.js';

export const catalogRoutes = new Hono();

// Public Read Access (Optional: restrict if B2B)
// For now, listing and viewing products is public.

// Products
catalogRoutes.get(
  '/products',
  validateQuery(listProductsQuerySchema),
  listProductsHandler
);

catalogRoutes.get(
  '/products/:id',
  getProductHandler
);

// Protected Write Access
catalogRoutes.post(
  '/products',
  authMiddleware,
  roleCheckMiddleware(['admin', 'manager']),
  validateRequest(createProductSchema),
  createProductHandler
);

catalogRoutes.put(
  '/products/:id',
  authMiddleware,
  roleCheckMiddleware(['admin', 'manager']),
  validateRequest(updateProductSchema),
  updateProductHandler
);

catalogRoutes.delete(
  '/products/:id',
  authMiddleware,
  roleCheckMiddleware(['admin', 'manager']),
  deleteProductHandler
);

// Categories
catalogRoutes.get('/categories', listCategoriesHandler);

// Price Lists
catalogRoutes.get('/price-lists', listPriceListsHandler);
