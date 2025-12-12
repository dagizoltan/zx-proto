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
import { unwrap, isErr } from '../../../../../lib/trust/index.js'; // 5 levels

// Products
export const listProductsHandler = async (c) => {
    const user = c.get('user');
    const tenantId = c.get('tenantId');
    const catalog = c.ctx.get('domain.catalog');

    // Parse Query Params
    const cursor = c.req.query('cursor');
    const q = c.req.query('q');
    const categoryId = c.req.query('categoryId');
    const minPrice = c.req.query('minPrice') ? parseFloat(c.req.query('minPrice')) : undefined;
    const maxPrice = c.req.query('maxPrice') ? parseFloat(c.req.query('maxPrice')) : undefined;
    const status = c.req.query('status');

    const res = await catalog.useCases.listProducts.execute(tenantId, {
        limit: 50,
        cursor,
        search: q,
        categoryId,
        minPrice,
        maxPrice,
        status,
        populate: ['category'] // Auto-populate category name
    });

    const { items: products, nextCursor } = unwrap(res);

    // Flatten Category for Display if needed?
    // The UI likely expects products[i].categoryName or products[i].category.name
    // Let's assume the template can handle `product.category?.name`.
    // If not, we might need to map it.
    // Checking CatalogPage... assumes it renders products.
    // Usually it renders `product.categoryName`.
    // With populate, `product.category` is an object.

    const viewProducts = products.map(p => ({
        ...p,
        categoryName: p.category?.name || 'Uncategorized'
    }));

    const html = await renderPage(CatalogPage, {
        user,
        products: viewProducts,
        query: q,
        nextCursor,
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

    const catRes = await catalog.useCases.listCategories.execute(tenantId, { limit: 1000 });
    const plRes = await catalog.useCases.listPriceLists.execute(tenantId, { limit: 1000 });

    const categories = unwrap(catRes).items;
    const priceLists = unwrap(plRes).items;

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
        unwrap(await catalog.useCases.createProduct.execute(tenantId, {
            name: body.name,
            sku: body.sku,
            description: body.description,
            price: parseFloat(body.price),
            costPrice: body.costPrice ? parseFloat(body.costPrice) : undefined,
            categoryId: body.categoryId || undefined,
            type: body.type
        }));
        return c.redirect('/ims/catalog/products');
    } catch (e) {
        // Fetch cats/pls again for render
        const catRes = await catalog.useCases.listCategories.execute(tenantId, { limit: 1000 });
        const plRes = await catalog.useCases.listPriceLists.execute(tenantId, { limit: 1000 });
        const categories = unwrap(catRes).items;
        const priceLists = unwrap(plRes).items;

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
  const catalog = c.ctx.get('domain.catalog'); // for getProduct
  const cursor = c.req.query('cursor');

  const prodRes = await catalog.useCases.getProduct.execute(tenantId, productId);
  if (isErr(prodRes)) return c.text('Product not found', 404);
  const product = prodRes.value;

  const [moveRes, stockRes] = await Promise.all([
    inventory.useCases.listStockMovements.execute(tenantId, productId, { limit: 20, cursor }),
    inventory.repositories.stock.queryByIndex(tenantId, 'product', productId, { limit: 1000 })
  ]);

  const moveData = unwrap(moveRes); // { items, nextCursor }
  const stockEntries = unwrap(stockRes).items;

  const currentStock = stockEntries.reduce((sum, e) => sum + (e.quantity - e.reservedQuantity), 0);

  const html = await renderPage(ProductDetailPage, {
    user,
    product,
    movements: moveData.items,
    stock: currentStock,
    nextCursor: moveData.nextCursor,
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

    const res = await catalog.useCases.listCategories.execute(tenantId, { limit: 50, cursor });
    const { items: categories, nextCursor } = unwrap(res);

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

    const res = await catalog.useCases.listCategories.execute(tenantId, { limit: 1000 });
    const { items: categories } = unwrap(res);

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
        unwrap(await catalog.useCases.createCategory.execute(tenantId, {
            name: body.name,
            description: body.description,
            parentId: body.parentId || undefined
        }));
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

    const catRes = await catalog.repositories.category.findById(tenantId, categoryId);
    if (isErr(catRes)) return c.text('Category not found', 404);
    const category = catRes.value;

    const res = await catalog.useCases.listCategories.execute(tenantId, { limit: 1000 });
    const { items: allCats } = unwrap(res);
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

    const res = await catalog.useCases.listPriceLists.execute(tenantId, { limit: 50, cursor });
    const { items: priceLists, nextCursor } = unwrap(res);

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
        unwrap(await catalog.useCases.createPriceList.execute(tenantId, {
            name: body.name,
            currency: body.currency,
            description: body.description,
            prices: {}
        }));
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

    const res = await catalog.repositories.priceList.findById(tenantId, plId);
    if (isErr(res)) return c.text('Price List not found', 404);
    const priceList = res.value;

    const html = await renderPage(PriceListDetailPage, {
        user,
        priceList,
        activePage: 'price-lists',
        layout: AdminLayout,
        title: `${priceList.name} - IMS Admin`
    });
    return c.html(html);
};
