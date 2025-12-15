import { Hono } from 'hono';
import { validateRequest, validateQuery } from '../middleware/validation-middleware.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { roleCheckMiddleware } from '../middleware/rbac-middleware.js';
import {
  listUsersQuerySchema,
  assignRolesSchema,
  createRoleSchema
} from '../validators/system.validator.js';
import {
  listUsersHandler,
  assignRolesHandler,
  listRolesHandler,
  createRoleHandler
} from '../handlers/system/index.js';

export const systemRoutes = new Hono();

// Auth required
systemRoutes.use('*', authMiddleware);
// RBAC: Only admin or manager
systemRoutes.use('*', roleCheckMiddleware(['admin', 'manager']));

// Users
systemRoutes.get(
  '/users',
  validateQuery(listUsersQuerySchema),
  listUsersHandler
);

systemRoutes.post(
  '/users/:id/roles',
  validateRequest(assignRolesSchema),
  assignRolesHandler
);

// Roles
systemRoutes.get(
  '/roles',
  listRolesHandler
);

systemRoutes.post(
  '/roles',
  validateRequest(createRoleSchema),
  createRoleHandler
);

