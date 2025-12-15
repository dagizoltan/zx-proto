import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createSendMessage } from "./send-message.js";
import { Ok, Err } from "../../../../../lib/trust/index.js";

Deno.test("Communication - Send Message", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should create new conversation if not provided", async () => {
    // Mocks
    const conversationRepository = {
      save: (tid, conv) => Promise.resolve(Ok(conv)),
      findById: (tid, id) => Promise.resolve(Ok({ id, participantIds: [] })),
    };
    const messageRepository = {
      save: (tid, msg) => Promise.resolve(Ok(msg)),
    };
    const eventBus = { publish: () => Promise.resolve() };

    const useCase = createSendMessage({ conversationRepository, messageRepository, eventBus });

    const input = {
      from: "user-1",
      to: "user-2",
      content: "Hello",
    };

    const result = await useCase(tenantId, input);

    assert(result.ok);
    assert(result.value.conversationId);
    assertEquals(result.value.content, "Hello");
  });

  await t.step("should use existing conversation", async () => {
     // Mocks
    const conversationRepository = {
      save: (tid, conv) => Promise.resolve(Ok(conv)),
      findById: (tid, id) => Promise.resolve(Ok({ id, participantIds: [] })),
    };
    const messageRepository = {
      save: (tid, msg) => Promise.resolve(Ok(msg)),
    };

    const useCase = createSendMessage({ conversationRepository, messageRepository });

    const input = {
      conversationId: "conv-existing",
      from: "user-1",
      content: "Hello again",
    };

    const result = await useCase(tenantId, input);

    assert(result.ok);
    assertEquals(result.value.conversationId, "conv-existing");
  });

  await t.step("should fail if 'to' is missing for new conversation", async () => {
    const useCase = createSendMessage({});
    const input = { from: "user-1", content: "Orphan message" };

    const result = await useCase(tenantId, input);

    assert(!result.ok);
    assertEquals(result.error.code, "VALIDATION_ERROR");
  });
});
