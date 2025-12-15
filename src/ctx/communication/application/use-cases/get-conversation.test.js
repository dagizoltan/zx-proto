import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createGetConversation } from "./get-conversation.js";
import { Ok, Err } from "../../../../../lib/trust/index.js";

Deno.test("Communication - Get Conversation", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should get conversation with messages and enrichment", async () => {
    // Mocks
    const mockConv = { id: "conv-1", participantIds: ["user-1", "user-2"] };
    const mockMessages = { items: [{ id: "msg-1", from: "user-1", content: "Hello" }] };
    const mockUsers = [{ id: "user-1", name: "Alice" }, { id: "user-2", name: "Bob" }];

    const conversationRepository = {
      findById: (tid, id) => Promise.resolve(Ok(mockConv)),
    };
    const messageRepository = {
      queryByIndex: (tid, idx, val, opts) => Promise.resolve(Ok(mockMessages)),
    };
    const identityAdapter = {
      getUsersByIds: (tid, ids) => Promise.resolve(Ok(mockUsers)),
    };

    const useCase = createGetConversation({ conversationRepository, messageRepository, identityAdapter });

    const result = await useCase(tenantId, "conv-1");

    assert(result);
    assertEquals(result.id, "conv-1");
    assertEquals(result.messages.length, 1);
    assertEquals(result.messages[0].authorName, "Alice"); // Enriched
    assertEquals(result.participants, ["Alice", "Bob"]); // Enriched
  });

  await t.step("should return null if conversation not found", async () => {
    const conversationRepository = {
      findById: () => Promise.resolve(Ok(null)),
    };
    const messageRepository = {};
    const identityAdapter = {};

    const useCase = createGetConversation({ conversationRepository, messageRepository, identityAdapter });

    const result = await useCase(tenantId, "conv-1");

    assertEquals(result, null);
  });
});
