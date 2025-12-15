import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createGetFeed } from "./get-feed.js";
import { Ok } from "../../../../../lib/trust/index.js";

Deno.test("Communication - Get Feed", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should get feed items", async () => {
    // Mocks
    const mockItems = { items: [{ id: "item-1", content: "Hello" }] };
    const feedRepository = {
      query: (tid, opts) => Promise.resolve(Ok(mockItems)),
    };

    const useCase = createGetFeed({ feedRepository });

    const result = await useCase(tenantId);

    assertEquals(result.items.length, 1);
    assertEquals(result.items[0].content, "Hello");
  });
});
