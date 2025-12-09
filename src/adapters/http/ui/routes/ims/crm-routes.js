import { Hono } from 'hono';
import * as handlers from '../../handlers/crm.handlers.js';

export const crmRoutes = new Hono();

// Customers
crmRoutes.get('/customers', handlers.listCustomersHandler);
crmRoutes.get('/customers/new', handlers.createCustomerPageHandler);
crmRoutes.post('/customers', handlers.createCustomerHandler);
crmRoutes.get('/customers/:id', handlers.customerDetailHandler);
