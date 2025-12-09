import { Hono } from 'hono';
import * as handlers from '../../handlers/catalog.handlers.js';

export const catalogRoutes = new Hono();

// Products
catalogRoutes.get('/products', handlers.listProductsHandler);
catalogRoutes.get('/products/new', handlers.createProductPageHandler);
catalogRoutes.post('/products', handlers.createProductHandler);
catalogRoutes.get('/products/:id', handlers.productDetailHandler);

// Categories
catalogRoutes.get('/categories', handlers.listCategoriesHandler);
catalogRoutes.get('/categories/new', handlers.createCategoryPageHandler);
catalogRoutes.post('/categories', handlers.createCategoryHandler);
catalogRoutes.get('/categories/:id', handlers.categoryDetailHandler);

// Price Lists
catalogRoutes.get('/price-lists', handlers.listPriceListsHandler);
catalogRoutes.get('/price-lists/new', handlers.createPriceListPageHandler);
catalogRoutes.post('/price-lists', handlers.createPriceListHandler);
catalogRoutes.get('/price-lists/:id', handlers.priceListDetailHandler);
