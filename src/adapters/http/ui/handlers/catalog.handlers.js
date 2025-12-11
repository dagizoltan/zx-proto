import { renderPage } from '../renderer.js';
import { AdminLayout } from '../layouts/admin-layout.jsx';
import { CatalogPage } from '../pages/ims/catalog/catalog-page.jsx';
import { CreateProductPage } from '../pages/ims/catalog/create-product-page.jsx';
import { CategoriesPage } from '../pages/ims/catalog/categories-page.jsx';
import { CreateCategoryPage } from '../pages/ims/catalog/create-category-page.jsx';
import { CategoryDetailPage } from '../pages/ims/catalog/category-detail-page.jsx';
import { PriceListsPage } from '../pages/ims/catalog/price-lists-page.jsx';
import { CreatePriceListPage } from '../pages/ims/catalog/create-price-list-page.jsx';
import { PriceListDetailPage } from '../pages/ims/catalog/price-list-detail-page.jsx';
import { ProductDetailPage } from '../pages/ims/product-detail-page.jsx';

// Products
export const listProductsHandler = async (c) => {
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
};

export const createProductPageHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');

    // Increased limit to 1000 for dropdowns
    const { items: categories } = await catalog.useCases.listCategories.execute(tenantId, { limit: 1000 });
    const { items: priceLists } = await catalog.useCases.listPriceLists.execute(tenantId, { limit: 1000 });

    const html = await renderPage(CreateProductPage, {
        user,
        categories,
        priceLists,
        activePage: 'catalog',
        layout: AdminLayout,
        title: 'Create Product - IMS Admin'
    });
    return c.html(html);
};

export const createProductHandler = async (c) => {
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
        return c.redirect('/ims/catalog/products');
    } catch (e) {
        const { items: categories } = await catalog.useCases.listCategories.execute(tenantId, { limit: 1000 });
        const { items: priceLists } = await catalog.useCases.listPriceLists.execute(tenantId, { limit: 1000 });

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
};

export const productDetailHandler = async (c) => {
  const user = c.get('user');
  const tenantId = c.get('tenantId');
  const productId = c.req.param('id');
  const inventory = c.ctx.get('domain.inventory');
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
};

// Categories
export const listCategoriesHandler = async (c) => {
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
};

export const createCategoryPageHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');

    const { items: categories } = await catalog.useCases.listCategories.execute(tenantId, { limit: 1000 });

    const html = await renderPage(CreateCategoryPage, {
        user,
        categories,
        activePage: 'categories',
        layout: AdminLayout,
        title: 'New Category - IMS Admin'
    });
    return c.html(html);
};

export const createCategoryHandler = async (c) => {
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');
    const body = await c.req.parseBody();

    try {
        await catalog.useCases.createCategory.execute(tenantId, {
            name: body.name,
            description: body.description,
            parentId: body.parentId || undefined
        });
        return c.redirect('/ims/catalog/categories');
    } catch (e) {
        return c.text(e.message, 400);
    }
};

export const categoryDetailHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const categoryId = c.req.param('id');
    const catalog = c.ctx.get('domain.catalog');

    const category = await catalog.repositories.category.findById(tenantId, categoryId);
    if (!category) return c.text('Category not found', 404);

    const { items: allCats } = await catalog.useCases.listCategories.execute(tenantId, { limit: 1000 });
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
};

// Price Lists
export const listPriceListsHandler = async (c) => {
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
};

export const createPriceListPageHandler = async (c) => {
    const user = c.get('user');

    const html = await renderPage(CreatePriceListPage, {
        user,
        activePage: 'price-lists',
        layout: AdminLayout,
        title: 'New Price List - IMS Admin'
    });
    return c.html(html);
};

export const createPriceListHandler = async (c) => {
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
        return c.redirect('/ims/catalog/price-lists');
    } catch (e) {
        return c.text(e.message, 400);
    }
};

export const priceListDetailHandler = async (c) => {
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
};
