import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createKeyVault } from "../lib/trust/vault.js";
import { createRepository } from "../lib/trust/repo.js";
import { useEncryption } from "../lib/trust/middleware/encryption.js";
import { useVersionedChain } from "../lib/trust/middleware/chain.js";
import { useSchema } from "../lib/trust/middleware/schema.js";
import { ProductTrustSchema, ProductTrustConfig } from "../src/ctx/catalog/domain/schemas/product.schema.js";

// Mock Master Key (32 bytes base64)
const MOCK_MASTER_KEY = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

Deno.test("Trust Platform Integration", async (t) => {
  const kv = await Deno.openKv(":memory:");
  const vault = createKeyVault(kv, MOCK_MASTER_KEY);
  const tenantId = "test-tenant";

  // Create Repository Pipeline
  const repo = createRepository(kv, [
    useSchema(ProductTrustSchema),
    useEncryption(vault, ProductTrustConfig),
    useVersionedChain()
  ]);

  let productId = crypto.randomUUID();

  await t.step("Save Encrypted Product", async () => {
    const product = {
      id: productId,
      tenantId,
      sku: "TEST-SKU",
      name: "Secret Widget",
      price: 100,
      quantity: 50,
      status: "ACTIVE",
      costPrice: 50.00 // Sensitive Data!
    };

    const result = await repo.save(tenantId, product);

    if (!result.ok) throw new Error(result.error.message);

    assertEquals(result.value.name, "Secret Widget");
    assertExists(result.value.hash, "Hash should be generated");
    assertEquals(result.value._v, 1, "Version should be 1");

    // VERIFY ENCRYPTION: result.value.costPrice should be an object { iv, ciphertext }
    assertEquals(typeof result.value.costPrice, "object", "Returned object should remain encrypted (DTO)");
    assertExists(result.value.costPrice.ciphertext);

    // Verify Storage (White Box)
    const rawEntry = await kv.get(['tenants', tenantId, 'data', 'product', productId]);
    const stored = rawEntry.value;

    assertExists(stored._k, "Wrapped Data Key should be stored");
    assertEquals(stored.name, "Secret Widget", "Name should be plain text");
  });

  await t.step("Find and Decrypt", async () => {
    const result = await repo.find(tenantId, productId);

    if (!result.ok) throw new Error(result.error?.message || "Find failed");

    const doc = result.value;
    assertEquals(doc.name, "Secret Widget");
    assertEquals(doc.costPrice, 50.00, "Should auto-decrypt sensitive field on read");
  });

  await t.step("Versioning & Chain", async () => {
    // Save Update
    const update = {
      id: productId,
      tenantId,
      sku: "TEST-SKU",
      name: "Secret Widget V2",
      price: 120,
      quantity: 40,
      costPrice: 55.00
    };

    const result = await repo.save(tenantId, update);
    const doc = result.value;

    // Check version increment
    assertEquals(doc._v, 2);
    assertExists(doc.prevHash, "Should link to previous hash");

    // Verify previous hash is NOT genesis
    const genesisHash = '0000000000000000000000000000000000000000000000000000000000000000';
    if (doc.prevHash === genesisHash) {
        throw new Error("Chain Broken: prevHash is still Genesis!");
    }
  });

  await kv.close();
});
