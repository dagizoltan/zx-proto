
import { assertEquals } from "https://deno.land/std@0.204.0/assert/mod.ts";

// Mocks
const mockKV = {
  get: () => Promise.resolve({ value: null }),
  set: () => Promise.resolve(),
  list: () => ({ [Symbol.asyncIterator]: async function*() { yield { key: [], value: {} } } })
};

// Test Notification Entity
import { Notification, NotificationLevel } from './src/ctx/system/domain/notification.js';
const n = Notification({
  id: '1',
  tenantId: 't1',
  level: NotificationLevel.INFO,
  title: 'Test',
  message: 'Hello'
});
console.log('✅ Notification Entity OK');

// Test Audit Log Entity
import { AuditLog } from './src/ctx/system/domain/audit-log.js';
const a = AuditLog({
  id: '1',
  tenantId: 't1',
  userId: 'u1',
  action: 'CREATE',
  resource: '/test',
  resourceId: '1'
});
console.log('✅ Audit Log Entity OK');

console.log('Verification Script Complete');
