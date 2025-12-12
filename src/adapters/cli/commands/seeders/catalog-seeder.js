import { Random, Log } from './utils.js';
import { unwrap, isErr } from '../../../../../lib/trust/index.js';

export const seedCatalog = async (ctx, tenantId) => {
    Log.step('Seeding Catalog (Categories, PriceLists, Products)');
    const catalog = ctx.get('domain.catalog');
    const inventory = ctx.get('domain.inventory');

    // 1. Categories
    const categories = ['Electronics', 'Computers', 'Smartphones', 'Accessories', 'Furniture', 'Chairs', 'Tables', 'Clothing', 'Men', 'Women', 'Kids'];
    const catMap = {}; // name -> id

    for (const name of categories) {
        // Use 'unwrap' to throw on error, preserving old flow or handle Result explicitly.
        // For seeding, if it fails, we assume it exists or retry.
        const res = await catalog.useCases.createCategory.execute(tenantId, { name, description: `Seeded ${name}` });

        if (res.ok) {
            catMap[name] = res.value.id;
        } else {
            // Assume exists, try fetch
            const allRes = await catalog.useCases.listCategories.execute(tenantId, { limit: 100 });
            if (allRes.ok) {
                catMap[name] = allRes.value.items.find(c => c.name === name)?.id;
            }
        }
    }

    // 2. PriceLists
    const pls = ['Retail', 'Wholesale', 'VIP'];
    const plIds = [];
    for (const name of pls) {
        const res = await catalog.useCases.createPriceList.execute(tenantId, { name, currency: 'USD' });
        if (res.ok) {
            plIds.push(res.value.id); // Push ID
        } else {
             const allRes = await catalog.useCases.listPriceLists.execute(tenantId, { limit: 10 });
             if (allRes.ok) {
                 const found = allRes.value.items.find(l => l.name === name);
                 if (found) plIds.push(found.id);
             }
        }
    }

    // 3. Products
    const products = [];
    Log.info('Generating 500 Products...');

    // Configurable T-Shirt
    let shirtId;
    const shirtRes = await catalog.useCases.createProduct.execute(tenantId, {
        sku: 'TSHIRT-BASE',
        name: 'Basic T-Shirt',
        price: 20,
        type: 'CONFIGURABLE',
        configurableAttributes: ['color', 'size'],
        categoryId: catMap['Clothing']
    });

    if (shirtRes.ok) {
        shirtId = shirtRes.value.id;
        const colors = ['Red', 'Blue', 'Black'];
        const sizes = ['S', 'M', 'L'];
        for (const c of colors) {
            for (const s of sizes) {
                const vRes = await catalog.useCases.createProduct.execute(tenantId, {
                    sku: `TSHIRT-${c.toUpperCase()}-${s}`,
                    name: `T-Shirt ${c} ${s}`,
                    price: 20,
                    type: 'VARIANT',
                    parentId: shirtId,
                    variantAttributes: { color: c, size: s },
                    categoryId: catMap['Clothing']
                });
                if (vRes.ok) products.push(vRes.value);
            }
        }
    }

    // Simple Products
    for (let i = 0; i < 500; i++) {
        const catName = Random.element(categories);
        const catId = catMap[catName];

        const pRes = await catalog.useCases.createProduct.execute(tenantId, {
            sku: `SKU-${10000 + i}`,
            name: `${catName} Item ${i}`,
            description: `A fantastic ${catName.toLowerCase()} product.`,
            price: Random.float(10, 500),
            categoryId: catId,
            type: 'SIMPLE',
            status: 'ACTIVE'
        });

        if (pRes.ok) products.push(pRes.value);

        Log.progress(i + 1, 500);
    }

    // 4. Update Price Lists with Prices
    // We can't update price list via useCase (no updatePriceList usecase exposed usually, or check catalog-use-cases.js).
    // Let's check `catalog.handlers.js` or `catalog-use-cases.js` if there is an update mechanism.
    // If not, we might need to use repository directly.
    // Assuming `catalog.repositories.priceList` is available.

    // Actually, `catalog` variable here is the context which has repositories.

    Log.info('Seeding Prices...');
    for (const plId of plIds) {
        const plRes = await catalog.repositories.priceList.findById(tenantId, plId);
        if (plRes.ok) {
            const pl = plRes.value;
            const newPrices = { ...pl.prices };

            // Add prices for 50 random products
            const sampleProducts = products.sort(() => 0.5 - Math.random()).slice(0, 50);
            for (const p of sampleProducts) {
                // Discount based on list name?
                let multiplier = 1.0;
                if (pl.name === 'Wholesale') multiplier = 0.8;
                if (pl.name === 'VIP') multiplier = 0.9;

                newPrices[p.id] = p.price * multiplier;
            }

            // Save back
            // PriceList repo uses `save`.
            await catalog.repositories.priceList.save(tenantId, {
                ...pl,
                prices: newPrices
            });
        }
    }

    Log.success(`Catalog seeded with ${products.length} active SKUs`);
    return products;
};
