
import { assertEquals, assertRejects } from "https://deno.land/std@0.204.0/assert/mod.ts";
import { createCreateProduct } from '../src/ctx/catalog/application/use-cases/create-product.js';

// Mock Dependencies
const mockProductRepo = {
    store: new Map(),
    save: async (tid, p) => { mockProductRepo.store.set(p.id, p); },
    findById: async (tid, id) => mockProductRepo.store.get(id)
};

const mockEventBus = {
    publish: async () => {}
};

Deno.test("Catalog Fix: Variant Validation", async (t) => {

    const useCase = createCreateProduct({
        productRepository: mockProductRepo,
        eventBus: mockEventBus
    });

    const parentId = crypto.randomUUID();

    await t.step("Setup Parent Product", async () => {
        const parent = {
            id: parentId,
            type: 'CONFIGURABLE',
            name: 'T-Shirt',
            configurableAttributes: ['color', 'size'], // Requires Color and Size
            tenantId: 'T1'
        };
        await mockProductRepo.save('T1', parent);
    });

    await t.step("Fail: Variant missing required attribute", async () => {
        const variant = {
            type: 'VARIANT',
            parentId: parentId,
            name: 'Red T-Shirt',
            variantAttributes: { color: 'Red' }, // Missing Size
            price: 100,
            sku: 'TS-RED'
        };

        // We expect it to fail on "size". But Zod might strip unknown fields?
        // No, I'm passing valid data now.
        // Wait, if I iterate keys of ['color', 'size'], it will hit 'size' eventually.

        await assertRejects(
            async () => await useCase.execute('T1', variant),
            Error,
            "Variant is missing required attribute: size"
        );
    });

    await t.step("Success: Variant has all attributes", async () => {
        const variant = {
            type: 'VARIANT',
            parentId: parentId,
            name: 'Red T-Shirt L',
            variantAttributes: { color: 'Red', size: 'L' },
            price: 100,
            sku: 'TS-RED-L'
        };

        const result = await useCase.execute('T1', variant);
        assertEquals(result.sku, 'TS-RED-L');
    });
});
