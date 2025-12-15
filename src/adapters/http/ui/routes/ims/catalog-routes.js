import { Hono } from 'hono';
import { listProductsHandler } from '../../handlers/catalog/list-products.handler.js';
import { createProductPageHandler } from '../../handlers/catalog/create-product-page.handler.js';
import { createProductHandler } from '../../handlers/catalog/create-product.handler.js';
import { productDetailHandler } from '../../handlers/catalog/product-detail.handler.js';
import { listCategoriesHandler } from '../../handlers/catalog/list-categories.handler.js';
import { createCategoryPageHandler } from '../../handlers/catalog/create-category-page.handler.js';
import { createCategoryHandler } from '../../handlers/catalog/create-category.handler.js';
import { categoryDetailHandler } from '../../handlers/catalog/category-detail.handler.js';
import { listPriceListsHandler } from '../../handlers/catalog/list-price-lists.handler.js';
import { createPriceListPageHandler } from '../../handlers/catalog/create-price-list-page.handler.js';
import { createPriceListHandler } from '../../handlers/catalog/create-price-list.handler.js';
import { priceListDetailHandler } from '../../handlers/catalog/price-list-detail.handler.js';

export const catalogRoutes = new Hono();

// Products
catalogRoutes.get('/products', listProductsHandler);
catalogRoutes.get('/products/new', createProductPageHandler);
catalogRoutes.post('/products', createProductHandler);
catalogRoutes.get('/products/:id', productDetailHandler);

// Categories
catalogRoutes.get('/categories', listCategoriesHandler);
catalogRoutes.get('/categories/new', createCategoryPageHandler);
catalogRoutes.post('/categories', createCategoryHandler);
catalogRoutes.get('/categories/:id', categoryDetailHandler);

// Price Lists
catalogRoutes.get('/price-lists', listPriceListsHandler);
catalogRoutes.get('/price-lists/new', createPriceListPageHandler);
catalogRoutes.post('/price-lists', createPriceListHandler);
catalogRoutes.get('/price-lists/:id', priceListDetailHandler);
