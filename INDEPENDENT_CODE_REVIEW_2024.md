# Independent Code Review: IMS Shopfront (2024)

**Date:** October 26, 2024
**Auditor:** Jules (AI Software Engineer)
**Scope:** Full "Black Box" & "Glass Box" Audit of Domains, Infrastructure, and Architecture.
**Target Standard:** Enterprise Grade (High Performance, Secure, Reliable).

---

## 1. Executive Summary

The **IMS Shopfront** codebase demonstrates a solid foundation with Clean Architecture principles and a clear separation of concerns. The use of Deno KV for persistence and the Service Locator pattern (`ContextRegistry`) provides a modular backbone.

However, the system is currently **NOT Enterprise Ready**. It resides in a **Late Beta / MVP+** state. While functional for single-tenant or low-concurrency use, it contains critical architectural flaws that would lead to data corruption, financial loss, and service denial under enterprise loads (high concurrency, distributed environment).

**Overall Rating:** ⚠️ **BETA (High Risk)**

---

## 2. Critical Findings (Severity: CRITICAL)

These issues pose an immediate risk to data integrity and business operations.

### 2.1. Inventory Denial of Service & Orphaned Stock
- **Location:** `src/ctx/orders/application/use-cases/create-order.js`
- **Issue:** The Order Creation Saga reserves stock *before* any payment confirmation. If the `orderRepository.save()` fails, a rollback is attempted. However:
    1. If the rollback (network call) fails, stock remains reserved forever ("Orphaned Stock").
    2. There is no background "Garbage Collector" for *unsaved* orders (orphan reservations). The `cancel_stale` task only cleans *saved* orders.
    3. **Attack Vector:** A malicious user can flood the API with valid order requests, locking up all inventory, then disconnect before payment/saving.
- **Impact:** Revenue loss, inability to sell inventory.

### 2.2. Purchase Order Race Condition (Financial Data Corruption)
- **Location:** `src/ctx/procurement/application/use-cases/po-use-cases.js`
- **Issue:** The `receivePurchaseOrder` use case fetches a PO, modifies `receivedQuantity` in memory, and saves it. It does *not* use atomic increments or version checks for the PO document itself.
- **Scenario:** Two warehouse workers scan items for the same PO simultaneously. Request A reads `Qty: 10`. Request B reads `Qty: 10`. A adds 5 -> `Qty: 15`. B adds 5 -> `Qty: 15`. A saves. B saves. Final Result: `15` (Should be `20`).
- **Impact:** Inventory levels in stock are correct (handled atomically), but the **Financial Document (PO)** is corrupt, leading to incorrect payments to suppliers.

### 2.3. "Zombie" Scheduler Tasks
- **Location:** `src/ctx/scheduler/domain/services/scheduler-service.js`
- **Issue:** Tasks are marked as `RUNNING` in the database. If the server crashes or restarts (common in serverless/containerized envs) during execution, the status remains `RUNNING` indefinitely.
- **Consequence:** The `tick()` loop ignores `RUNNING` tasks. The task effectively dies and never runs again.
- **Impact:** Critical background jobs (Backups, Stock Checks) silently stop working.

---

## 3. Security & Compliance (Severity: HIGH)

### 3.1. Rate Limiting is Instance-Local
- **Location:** `src/adapters/http/middleware/rate-limit.js`
- **Issue:** Uses in-memory `LRUCache`. In a distributed environment (e.g., Deno Deploy with multiple isolates/regions), limits are not shared.
- **Risk:** An attacker can bypass rate limits by hitting different regions or rotating connections, enabling DoS attacks.
- **Recommendation:** Move rate limiting state to Deno KV (atomic counters with TTL).

### 3.2. Password Policy & SKU Validation
- **Location:** `src/adapters/http/api/validators/auth.validator.js`, `catalog.validator.js`
- **Issue:**
    - Registration allows simple 8-char passwords (no complexity enforced).
    - `SKU` validation allows *any* string. Malicious actors could inject massive strings or control characters.
- **Risk:** Account compromise; Storage/Indexing bloat.

### 3.3. Multi-Tenant Isolation Gaps (Scheduler)
- **Location:** `main.js`, `SchedulerService`
- **Issue:** The Cron Ticker runs only for the `default` tenant (or single configured tenant). It does not iterate over all active tenants.
- **Impact:** In a SaaS model, only the primary tenant gets background jobs. Other tenants get broken features (no stales cancelled, no recurring orders).

---

## 4. Performance & Scalability (Severity: MEDIUM)

### 4.1. Order Creation Bottleneck (Optimized but risky)
- **Location:** `createOrder`
- **Observation:** Currently fetches products in batch (Good). However, stock reservation uses `inventory.useCases.reserveStock.executeBatch`. If this batch operation takes > 5-10s (KV Transaction limit), it will timeout.
- **Limit:** Deno KV transactions have time and key limits. Large orders (e.g., B2B with 100+ lines) may hit atomic limits.

### 4.2. In-Memory Pagination
- **Location:** `createBaseRepository.findAll` (Inferred from standard pattern)
- **Issue:** Most list operations load *all* data or rely on in-memory filtering after fetching large chunks.
- **Impact:** As data grows to 100k+ records, memory usage will spike, causing OOM (Out of Memory) crashes.

---

## 5. Recommendations: Roadmap to Enterprise

### Phase 1: Stabilization (Immediate Fixes)
1.  **Fix PO Race Condition:** Implement "Versionstamp" checks (OCC) for Purchase Order updates, similar to Inventory.
2.  **Cure Zombie Tasks:** Add a "Startup Recovery" or "Timeout Monitor" that resets `RUNNING` tasks > 30 mins old to `IDLE` or `FAILED`.
3.  **Secure Inventory Reservation:** Move stock reservation to *after* payment intent (or use short TTL holds), and implement a robust "Garbage Collector" for orphaned reservations.

### Phase 2: Security Hardening
4.  **Distributed Rate Limiting:** Rewrite middleware to use `kv.atomic().check().set().commit()` for global counting.
5.  **Multi-Tenant Scheduler:** Refactor `SchedulerService.tick()` to iterate through a global `tenants` list or trigger via per-tenant webhooks.
6.  **Enhanced Validation:** Enforce strict regex for SKUs (`^[A-Za-z0-9-_]+$`) and password complexity.

### Phase 3: Scale
7.  **Cursor-Based Pagination:** Move away from `offset` or in-memory slicing. Use Deno KV's natural lexicographical ordering for true cursor pagination.
8.  **Async Processing:** Move heavy writes (like "Update History") to background queues (Deno KV Queues) to reduce API latency.

---

**Signed,**
*Jules*
*AI Lead Software Engineer*
