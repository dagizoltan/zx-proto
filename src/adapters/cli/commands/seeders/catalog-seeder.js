import { Random, Log, faker } from './utils.js';
import { unwrap, isErr } from '@lib/trust/index.js';

export const seedCatalog = async (ctx, tenantId) => {
    Log.step('Seeding Catalog (Categories, PriceLists, Products)');
    const catalog = ctx.get('domain.catalog');
    const inventory = ctx.get('domain.inventory');

    // 1. Categories
    const categoriesStructure = [
        { name: 'Electronics', subs: ['Computers', 'Smartphones', 'Audio', 'Cameras'] },
        { name: 'Home & Garden', subs: ['Furniture', 'Kitchen', 'Bedding', 'Decor'] },
        { name: 'Fashion', subs: ['Men', 'Women', 'Kids', 'Accessories'] },
        { name: 'Sports', subs: ['Fitness', 'Outdoor', 'Cycling'] }
    ];

    const catMap = {}; // name -> id
    const subCatMap = {}; // subname -> { id, parentName }

    for (const group of categoriesStructure) {
        // Create Parent
        let parentId;
        const res = await catalog.useCases.createCategory.execute(tenantId, { name: group.name, description: `Department: ${group.name}` });
        if (res.ok) {
            parentId = res.value.id;
            catMap[group.name] = parentId;
        } else {
             const allRes = await catalog.useCases.listCategories.execute(tenantId, { limit: 100 });
             if (allRes.ok) {
                 parentId = allRes.value.items.find(c => c.name === group.name)?.id;
                 catMap[group.name] = parentId;
             }
        }

        // Create Subs
        if (parentId) {
            for (const sub of group.subs) {
                 const subRes = await catalog.useCases.createCategory.execute(tenantId, { name: sub, parentId, description: `${sub} Products` });
                 if (subRes.ok) {
                     subCatMap[sub] = { id: subRes.value.id, parentName: group.name };
                 } else {
                     const allRes = await catalog.useCases.listCategories.execute(tenantId, { limit: 100 });
                     if (allRes.ok) {
                         const found = allRes.value.items.find(c => c.name === sub);
                         if (found) subCatMap[sub] = { id: found.id, parentName: group.name };
                     }
                 }
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

    // Configurable T-Shirt (Keep this for testing variants)
    let shirtId;
    const shirtRes = await catalog.useCases.createProduct.execute(tenantId, {
        sku: 'TSHIRT-BASE',
        name: 'Basic T-Shirt',
        price: 20,
        type: 'CONFIGURABLE',
        configurableAttributes: ['color', 'size'],
        categoryId: subCatMap['Men']?.id || catMap['Fashion']
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
                    categoryId: subCatMap['Men']?.id || catMap['Fashion']
                });
                if (vRes.ok) products.push(vRes.value);
            }
        }
    }

    // Simple Products (Realistic)
    const subCategories = Object.keys(subCatMap);

    for (let i = 0; i < 500; i++) {
        const subName = Random.element(subCategories);
        const { id: catId, parentName } = subCatMap[subName];

        let name, price, description, material;

        // Contextual generation
        if (parentName === 'Electronics') {
            name = faker.commerce.productName(); // Generic, but fits
            price = parseFloat(faker.commerce.price({ min: 100, max: 2000 }));
            description = faker.commerce.productDescription();
        } else if (parentName === 'Fashion') {
            name = `${faker.commerce.productAdjective()} ${subName.slice(0, -1)}`; // "Sleek Shirt"
            price = parseFloat(faker.commerce.price({ min: 20, max: 200 }));
            description = `A stylish ${name} made from ${faker.commerce.productMaterial()}.`;
        } else {
            name = faker.commerce.productName();
            price = parseFloat(faker.commerce.price({ min: 10, max: 500 }));
            description = faker.commerce.productDescription();
        }

        const pRes = await catalog.useCases.createProduct.execute(tenantId, {
            sku: `SKU-${10000 + i}`,
            name: name,
            description: description,
            price: price,
            categoryId: catId,
            type: 'SIMPLE',
            status: 'ACTIVE'
        });

        if (pRes.ok) products.push(pRes.value);

        Log.progress(i + 1, 500);
    }

    // 4. Update Price Lists with Prices
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
            await catalog.repositories.priceList.save(tenantId, {
                ...pl,
                prices: newPrices
            });
        }
    }

    Log.success(`Catalog seeded with ${products.length} active SKUs`);
    return products;
};
