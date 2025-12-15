import { Hono } from 'hono';
import { listCustomersHandler } from '../../handlers/crm/list-customers.handler.js';
import { createCustomerPageHandler } from '../../handlers/crm/create-customer-page.handler.js';
import { createCustomerHandler } from '../../handlers/crm/create-customer.handler.js';
import { customerDetailHandler } from '../../handlers/crm/customer-detail.handler.js';

export const crmRoutes = new Hono();

// Customers
crmRoutes.get('/customers', listCustomersHandler);
crmRoutes.get('/customers/new', createCustomerPageHandler);
crmRoutes.post('/customers', createCustomerHandler);
crmRoutes.get('/customers/:id', customerDetailHandler);
