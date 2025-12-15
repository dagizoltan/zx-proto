import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createListConversations } from "./list-conversations.js";
import { Ok } from "../../../../../lib/trust/index.js";

Deno.test("Communication - List Conversations", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should list conversations with enrichment", async () => {
    // Mocks
    const mockConvs = { items: [{ id: "conv-1", participantIds: ["user-1"] }] };
    const mockUsers = [{ id: "user-1", name: "Alice" }];

    const conversationRepository = {
      query: (tid, opts) => Promise.resolve(Ok(mockConvs)),
    };
    const identityAdapter = {
      getUsersByIds: (tid, ids) => Promise.resolve(Ok(mockUsers)),
    };

    const useCase = createListConversations({ conversationRepository, identityAdapter });

    const result = await useCase(tenantId);

    assertEquals(result.items.length, 1);
    assertEquals(result.items[0].participants, ["Alice"]);
  });
});
