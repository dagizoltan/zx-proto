import { assertEquals, assertThrows } from "https://deno.land/std@0.204.0/assert/mod.ts";
import { Notification, NotificationLevel } from './notification.js';

Deno.test("Notification Entity - Create Valid", () => {
  const n = Notification({
    id: '1',
    tenantId: 't1',
    level: NotificationLevel.INFO,
    title: 'Test',
    message: 'Hello'
  });

  assertEquals(n.level, 'INFO');
  assertEquals(n.read, false);
});

Deno.test("Notification Entity - Invalid Level", () => {
  assertThrows(() => {
    Notification({
      id: '1',
      tenantId: 't1',
      level: 'INVALID',
      title: 'Test',
      message: 'Hello'
    });
  });
});
