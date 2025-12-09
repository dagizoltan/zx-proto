import { Hono } from 'hono';
import { validateQuery } from '../middleware/validation-middleware.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { roleCheckMiddleware } from '../middleware/rbac-middleware.js';
import { listCustomersQuerySchema } from '../validators/crm.validator.js';
import { listCustomersHandler, getCustomerHandler } from '../handlers/crm/index.js';

export const crmRoutes = new Hono();

// Auth & RBAC
crmRoutes.use('*', authMiddleware);
crmRoutes.use('*', roleCheckMiddleware(['admin', 'manager']));

crmRoutes.get(
  '/customers',
  validateQuery(listCustomersQuerySchema),
  listCustomersHandler
);

crmRoutes.get(
  '/customers/:id',
  getCustomerHandler
);
