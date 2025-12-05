import { Hono } from 'hono';
import { renderPage } from '../../renderer.js';
import { AdminLayout } from '../../layouts/admin-layout.jsx';
import { CatalogPage } from '../../pages/admin/catalog/catalog-page.jsx';
import { CreateProductPage } from '../../pages/admin/catalog/create-product-page.jsx';
import { CategoriesPage } from '../../pages/admin/catalog/categories-page.jsx';
import { CreateCategoryPage } from '../../pages/admin/catalog/create-category-page.jsx';
import { CategoryDetailPage } from '../../pages/admin/catalog/category-detail-page.jsx';
import { PriceListsPage } from '../../pages/admin/catalog/price-lists-page.jsx';
import { CreatePriceListPage } from '../../pages/admin/catalog/create-price-list-page.jsx';
import { PriceListDetailPage } from '../../pages/admin/catalog/price-list-detail-page.jsx';
import { ProductDetailPage } from '../../pages/admin/product-detail-page.jsx'; // Note: Product Detail is often linked from Catalog

export const catalogRoutes = new Hono();

// Products
catalogRoutes.get('/', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');
    const page = parseInt(c.req.query('page') || '1');
    const query = c.req.query('q');

    let products;
    if (query) {
        products = await catalog.useCases.searchProducts.execute(tenantId, query);
    } else {
        products = await catalog.useCases.listProducts.execute(tenantId, page, 50);
    }

    const html = await renderPage(CatalogPage, {
        user,
        products,
        query,
        activePage: 'catalog',
        layout: AdminLayout,
        title: 'Catalog - IMS Admin'
    });
    return c.html(html);
});

catalogRoutes.get('/products/new', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');

    const { items: categories } = await catalog.useCases.listCategories.execute(tenantId, { limit: 100 });
    const { items: priceLists } = await catalog.useCases.listPriceLists.execute(tenantId, { limit: 100 });

    const html = await renderPage(CreateProductPage, {
        user,
        categories,
        priceLists,
        activePage: 'catalog',
        layout: AdminLayout,
        title: 'Create Product - IMS Admin'
    });
    return c.html(html);
});

catalogRoutes.post('/products', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');
    const body = await c.req.parseBody();

    try {
        await catalog.useCases.createProduct.execute(tenantId, {
            name: body.name,
            sku: body.sku,
            description: body.description,
            price: parseFloat(body.price),
            costPrice: body.costPrice ? parseFloat(body.costPrice) : undefined,
            categoryId: body.categoryId || undefined,
            type: body.type
        });
        return c.redirect('/admin/catalog');
    } catch (e) {
        const { items: categories } = await catalog.useCases.listCategories.execute(tenantId, { limit: 100 });
        const { items: priceLists } = await catalog.useCases.listPriceLists.execute(tenantId, { limit: 100 });

        const html = await renderPage(CreateProductPage, {
            user,
            categories,
            priceLists,
            activePage: 'catalog',
            layout: AdminLayout,
            title: 'Create Product - IMS Admin',
            error: e.message,
            values: body
        });
        return c.html(html, 400);
    }
});

catalogRoutes.get('/products/:id', async (c) => {
  const user = c.get('user');
  const tenantId = c.get('tenantId');
  const productId = c.req.param('id');
  const inventory = c.ctx.get('domain.inventory');
  // Note: Product Detail combines Catalog info (Product) + Inventory info (Movements)
  // Logic from original route:
  const cursor = c.req.query('cursor');

  const product = await inventory.useCases.getProduct.execute(tenantId, productId);
  if (!product) return c.text('Product not found', 404);

  const [{ items: movements, nextCursor }, stockEntries] = await Promise.all([
    inventory.useCases.listStockMovements.execute(tenantId, productId, { limit: 20, cursor }),
    inventory.repositories.stock.getEntriesForProduct(tenantId, productId)
  ]);

  const currentStock = stockEntries.reduce((sum, e) => sum + (e.quantity - e.reservedQuantity), 0);

  const html = await renderPage(ProductDetailPage, {
    user,
    product,
    movements,
    stock: currentStock,
    nextCursor,
    currentUrl: c.req.url,
    layout: AdminLayout,
    title: `${product.name} - IMS Admin`
  });

  return c.html(html);
});

// Categories
catalogRoutes.get('/categories', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');
    const cursor = c.req.query('cursor');

    const { items: categories, nextCursor } = await catalog.useCases.listCategories.execute(tenantId, { limit: 50, cursor });

    const html = await renderPage(CategoriesPage, {
        user,
        categories,
        nextCursor,
        activePage: 'categories',
        layout: AdminLayout,
        title: 'Categories - IMS Admin'
    });
    return c.html(html);
});

catalogRoutes.get('/categories/new', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');

    const { items: categories } = await catalog.useCases.listCategories.execute(tenantId, { limit: 100 });

    const html = await renderPage(CreateCategoryPage, {
        user,
        categories,
        activePage: 'categories',
        layout: AdminLayout,
        title: 'New Category - IMS Admin'
    });
    return c.html(html);
});

catalogRoutes.post('/categories', async (c) => {
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');
    const body = await c.req.parseBody();

    try {
        await catalog.useCases.createCategory.execute(tenantId, {
            name: body.name,
            description: body.description,
            parentId: body.parentId || undefined
        });
        return c.redirect('/admin/catalog/categories'); // Normalized URL
    } catch (e) {
        return c.text(e.message, 400);
    }
});

catalogRoutes.get('/categories/:id', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const categoryId = c.req.param('id');
    const catalog = c.ctx.get('domain.catalog');

    const category = await catalog.repositories.category.findById(tenantId, categoryId);
    if (!category) return c.text('Category not found', 404);

    const { items: allCats } = await catalog.useCases.listCategories.execute(tenantId, { limit: 100 });
    const subCategories = allCats.filter(cat => cat.parentId === categoryId);

    const html = await renderPage(CategoryDetailPage, {
        user,
        category,
        subCategories,
        activePage: 'categories',
        layout: AdminLayout,
        title: `${category.name} - IMS Admin`
    });
    return c.html(html);
});

// Price Lists
catalogRoutes.get('/price-lists', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');
    const cursor = c.req.query('cursor');

    const { items: priceLists, nextCursor } = await catalog.useCases.listPriceLists.execute(tenantId, { limit: 50, cursor });

    const html = await renderPage(PriceListsPage, {
        user,
        priceLists,
        nextCursor,
        activePage: 'price-lists',
        layout: AdminLayout,
        title: 'Price Lists - IMS Admin'
    });
    return c.html(html);
});

catalogRoutes.get('/price-lists/new', async (c) => {
    const user = c.get('user');

    const html = await renderPage(CreatePriceListPage, {
        user,
        activePage: 'price-lists',
        layout: AdminLayout,
        title: 'New Price List - IMS Admin'
    });
    return c.html(html);
});

catalogRoutes.post('/price-lists', async (c) => {
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');
    const body = await c.req.parseBody();

    try {
        await catalog.useCases.createPriceList.execute(tenantId, {
            name: body.name,
            currency: body.currency,
            description: body.description,
            prices: {}
        });
        return c.redirect('/admin/catalog/price-lists'); // Normalized URL
    } catch (e) {
        return c.text(e.message, 400);
    }
});

catalogRoutes.get('/price-lists/:id', async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const plId = c.req.param('id');
    const catalog = c.ctx.get('domain.catalog');

    const priceList = await catalog.repositories.priceList.findById(tenantId, plId);
    if (!priceList) return c.text('Price List not found', 404);

    const html = await renderPage(PriceListDetailPage, {
        user,
        priceList,
        activePage: 'price-lists',
        layout: AdminLayout,
        title: `${priceList.name} - IMS Admin`
    });
    return c.html(html);
});
