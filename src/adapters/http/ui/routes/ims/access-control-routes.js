import { Hono } from 'hono';
import { listUsersHandler } from '../../handlers/access-control/list-users.handler.js';
import { createUserPageHandler } from '../../handlers/access-control/create-user-page.handler.js';
import { createUserHandler } from '../../handlers/access-control/create-user.handler.js';
import { userDetailHandler } from '../../handlers/access-control/user-detail.handler.js';
import { listRolesHandler } from '../../handlers/access-control/list-roles.handler.js';
import { createRolePageHandler } from '../../handlers/access-control/create-role-page.handler.js';
import { createRoleHandler } from '../../handlers/access-control/create-role.handler.js';
import { roleDetailHandler } from '../../handlers/access-control/role-detail.handler.js';

export const accessControlRoutes = new Hono();

// Users
accessControlRoutes.get('/users', listUsersHandler);
accessControlRoutes.get('/users/new', createUserPageHandler);
accessControlRoutes.post('/users', createUserHandler);
accessControlRoutes.get('/users/:id', userDetailHandler);

// Roles
accessControlRoutes.get('/roles', listRolesHandler);
accessControlRoutes.get('/roles/new', createRolePageHandler);
accessControlRoutes.post('/roles', createRoleHandler);
accessControlRoutes.get('/roles/:id', roleDetailHandler);
