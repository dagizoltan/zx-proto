import { Random, Log } from './utils.js';

export const seedCatalog = async (ctx, tenantId) => {
    Log.step('Seeding Catalog (Categories, PriceLists, Products)');
    const catalog = ctx.get('domain.catalog');
    const inventory = ctx.get('domain.inventory');

    // 1. Categories
    const categories = ['Electronics', 'Computers', 'Smartphones', 'Accessories', 'Furniture', 'Chairs', 'Tables', 'Clothing', 'Men', 'Women', 'Kids'];
    const catMap = {}; // name -> id

    for (const name of categories) {
        try {
            const cat = await catalog.useCases.createCategory.execute(tenantId, { name, description: `Seeded ${name}` });
            catMap[name] = cat.id;
        } catch (e) {
            const all = await catalog.useCases.listCategories.execute(tenantId, { limit: 100 });
            catMap[name] = all.items.find(c => c.name === name)?.id;
        }
    }

    // 2. PriceLists
    const pls = ['Retail', 'Wholesale', 'VIP'];
    const plIds = [];
    for (const name of pls) {
        try {
            const pl = await catalog.useCases.createPriceList.execute(tenantId, { name, currency: 'USD' });
            plIds.push(pl);
        } catch (e) {
             const all = await catalog.useCases.listPriceLists.execute(tenantId, { limit: 10 });
             const found = all.items.find(l => l.name === name);
             if (found) plIds.push(found);
        }
    }

    // 3. Products (1000)
    const products = [];
    Log.info('Generating 500 Products...');

    // Configurable T-Shirt
    try {
        const shirt = await catalog.useCases.createProduct.execute(tenantId, {
            sku: 'TSHIRT-BASE', name: 'Basic T-Shirt', price: 20, type: 'CONFIGURABLE', configurableAttributes: ['color', 'size'], category: 'Clothing'
        });
        const colors = ['Red', 'Blue', 'Black'];
        const sizes = ['S', 'M', 'L'];
        for (const c of colors) {
            for (const s of sizes) {
                const v = await catalog.useCases.createProduct.execute(tenantId, {
                    sku: `TSHIRT-${c.toUpperCase()}-${s}`,
                    name: `T-Shirt ${c} ${s}`,
                    price: 20,
                    type: 'VARIANT',
                    parentId: shirt.id,
                    variantAttributes: { color: c, size: s },
                    category: 'Clothing'
                });
                products.push(v);
            }
        }
    } catch(e) {}

    // Simple Products
    for (let i = 0; i < 500; i++) {
        try {
            const cat = Random.element(categories);
            const p = await catalog.useCases.createProduct.execute(tenantId, {
                sku: `SKU-${10000 + i}`,
                name: `${cat} Item ${i}`,
                description: `A fantastic ${cat.toLowerCase()} product.`,
                price: Random.float(10, 500),
                category: cat,
                type: 'SIMPLE',
                status: 'ACTIVE'
            });
            products.push(p);
        } catch (e) {}
        Log.progress(i + 1, 500);
    }

    Log.success(`Catalog seeded with ${products.length} active SKUs`);
    return products;
};
