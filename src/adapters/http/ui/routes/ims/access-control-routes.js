import { Hono } from 'hono';
import * as handlers from '../../handlers/access-control.handlers.js';

export const accessControlRoutes = new Hono();

// Users
accessControlRoutes.get('/users', handlers.listUsersHandler);
accessControlRoutes.get('/users/new', handlers.createUserPageHandler);
accessControlRoutes.post('/users', handlers.createUserHandler);
accessControlRoutes.get('/users/:id', handlers.userDetailHandler);

// Roles
accessControlRoutes.get('/roles', handlers.listRolesHandler);
accessControlRoutes.get('/roles/new', handlers.createRolePageHandler);
accessControlRoutes.post('/roles', handlers.createRoleHandler);
accessControlRoutes.get('/roles/:id', handlers.roleDetailHandler);
