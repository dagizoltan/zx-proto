import { Hono } from 'hono';
import * as handlers from '../../handlers/system.handlers.js';

export const systemRoutes = new Hono();

// Users
systemRoutes.get('/users', handlers.listUsersHandler);
systemRoutes.get('/users/new', handlers.createUserPageHandler);
systemRoutes.post('/users', handlers.createUserHandler);
systemRoutes.get('/users/:id', handlers.userDetailHandler);

// Roles
systemRoutes.get('/roles', handlers.listRolesHandler);
systemRoutes.get('/roles/new', handlers.createRolePageHandler);
systemRoutes.post('/roles', handlers.createRoleHandler);
systemRoutes.get('/roles/:id', handlers.roleDetailHandler);

// Settings
systemRoutes.get('/settings', handlers.settingsHandler);
