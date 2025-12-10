# Feature Matrix & Status

**Generated:** October 26, 2023
**Reviewer:** Jules (AI Software Engineer)

## Legend
*   ✅ **Production Ready:** Atomic, tested, robust.
*   ⚠️ **Beta / Technical Debt:** Functional but has known issues (N+1, atomicity gaps, scaling limits).
*   ❌ **Broken / Missing:** Critical bug or completely unimplemented.
*   🚧 **WIP:** Placeholder or incomplete logic.

| Domain | Feature | Endpoint / Component | Type | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | Login | `POST /auth/login` | API | ✅ | Standard BCrypt + JWT. |
| **Auth** | RBAC | `roleCheckMiddleware` | Middleware | ✅ | Fixed N+1 issues. Good batching. |
| **Auth** | Password Reset | - | - | ❌ | **Critical Gap.** No way to recover account. |
| **Catalog** | List Products | `GET /catalog/products` | API | ⚠️ | **Scaling Risk.** Uses `kv.list` + in-memory filter. O(N) scan. |
| **Catalog** | Search Products | `GET /catalog/products?q=` | API | ⚠️ | **Performance.** In-memory text search over all keys. |
| **Catalog** | Product Detail | `GET /catalog/products/:id` | API | ✅ | Efficient ID lookup. |
| **Catalog** | Pricing Engine | `PricingService` | Service | ⚠️ | Logic correct but limited (Single Rule). No Tiered/Bulk pricing. |
| **Inventory** | Stock Level | `GET /inventory/:id` | API | ⚠️ | Recalculates total by summing all batches (O(N)) on write. |
| **Inventory** | Allocate | `StockAllocationService` | Service | ✅ | **Excellent.** Uses OCC/Versionstamps + Retry Loop. |
| **Inventory** | Receive Stock | `POST /inventory/receive` | API | ✅ | Atomic per item. |
| **Orders** | Create Order | `POST /orders` | API | ✅ | **Robust.** Saga pattern rolls back stock if save fails. |
| **Orders** | Update Status | `PUT /orders/:id/status` | API | ✅ | Strict State Machine (Prevent illegal transitions). |
| **Orders** | List Orders | `GET /orders` | API | ⚠️ | Index exists (`orders_by_user`) but default list does full scan. |
| **Procurement** | Receive PO | `POST /procurement/po/:id/receive` | API | ❌ | **Critical Integrity Bug.** Loops through items and commits 1-by-1. Partial failure corrupts PO state. |
| **Manufacturing** | Complete WO | `POST /manufacturing/wo/:id/complete` | API | ✅ | **Excellent.** Atomic "Consume + Produce" transaction. |
| **System** | Scheduler | `SchedulerService` | Service | ⚠️ | **Reliability.** Fetches *all* tasks every minute. No distributed locking (though Deno Cron is singleton). |
| **System** | Audit Logs | `GET /system/audit-logs` | API | ⚠️ | Naive list. No tamper-evidence (unless On-Chain). |
| **System** | Notifications | `SSE /notifications` | UI | ✅ | Real-time push works well. |
| **UI** | List Pages | All `*.handlers.js` | UI | ⚠️ | **N+1 Queries.** Fetches 100 items, then often fetches related entities 1-by-1. |
| **UI** | PDF Output | - | - | ❌ | **MVP Blocker.** No Invoices/Packing Slips. |
