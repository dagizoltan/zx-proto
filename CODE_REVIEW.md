# Code Review & Evaluation Report

## 1. Executive Summary
The codebase follows a clear Clean Architecture pattern with Domain-Driven Design (DDD) principles. The separation of concerns between Use Cases, Entities, and Repositories is well-maintained. The recent refactoring to use a "Trust Platform Core" (`lib/trust`) has standardized data access and validation.

However, there are **critical robustness issues** regarding data integrity across domain boundaries. The architecture relies on "Eventual Consistency" or "Sagas" but lacks the necessary recovery mechanisms (compensating transactions) for when things go wrong. This creates a high risk of "Phantom Stock" (inventory deducted but no order/shipment) and "Orphaned Reservations".

## 2. Critical Findings (Bugs & Integrity)

### 2.1. Cross-Domain Transaction Failure (Phantom Stock)
**Severity:** Critical
**Domains:** Orders, Procurement, Manufacturing
**Description:**
The system frequently performs an inventory action (Reserve, Commit, Receive) *before* saving the primary entity (Order, Shipment, PO). If the primary entity save fails (e.g., database conflict, validation error), the inventory action is **not rolled back**.

*   **Order Creation:** `createOrder` reserves stock. If `orderRepo.save` fails, it *attempts* to release stock. If that release fails (network/crash), stock remains reserved forever.
*   **Shipment Creation:** `createShipment` commits stock (hard deduction). If `shipmentRepo.save` fails, stock is gone, but no shipment record exists.
*   **PO Receipt:** `receivePurchaseOrder` adds stock. If `poRepo.save` fails, stock remains added.
*   **Work Orders:** `completeWorkOrder` consumes materials. If `woRepo.save` fails, materials are lost.

**Suggested Fix:**
Implement "Cross-Domain Transactions" by passing the `atomic` operation object from the Trust Core into the Use Cases.
```javascript
// Example Strategy
await runTransaction(kvPool, async (atomic) => {
    // Pass 'atomic' to inventory service
    await inventoryService.receiveStockBatch.execute(..., { atomic });
    // Pass 'atomic' to PO repo
    await poRepository.save(..., { atomic });
});
```

### 2.2. Race Conditions in State Transitions
**Severity:** High
**Domains:** Procurement, Access Control
**Description:**
*   **User Registration:** Checks for email uniqueness via `queryByIndex` (read) then `save` (write). Two concurrent requests can both see "no user" and both save, resulting in duplicate emails (or index corruption depending on KV behavior).
*   **PO Receipt:** Two users clicking "Receive" on a PO simultaneously will both trigger stock addition, resulting in double inventory. The Optimistic Locking on the PO entity (`_versionstamp`) only fails the *second* PO save, but the inventory addition happens *before* that check.

**Suggested Fix:**
*   **Unique Constraints:** Use specific KV keys for uniqueness (e.g., `users/email/{email} -> id`) and check/set them atomically.
*   **Idempotency:** Inventory operations should be idempotent (e.g., `receiveStock` should check if `PO-123` was already processed), or tightly coupled in the transaction.

### 2.3. Performance Bottleneck in Batch Operations
**Severity:** Medium
**Domains:** Inventory, Orders
**Description:**
`StockAllocationService.fetchStockEntries` iterates through a list of Product IDs and calls `repo.query` for *each* one.
*   For an order with 50 items, this triggers 50 separate KV Scan operations.
*   `repo.query` itself performs a "Loop Scan" (fetching 1000 items and filtering in memory).
*   This is an **O(N * M)** operation where N is items in order and M is batches per product.

**Suggested Fix:**
Implement `stockRepository.findEntriesByProductIds(tenantId, productIds)` that uses `kv.getMany` or parallelized queries to fetch all needed stock in one go.

## 3. Code Quality & Hygiene

### 3.1. Robustness
*   **Connection Pool:** `kv-connection-pool.js` lacks timeouts. If `acquire()` is called when the pool is empty, it waits indefinitely. A logic error holding a connection could freeze the entire app.
*   **Error Handling:** Use Cases return `Result` types (`Ok/Err`). Ensure all Handlers consistently `unwrap()` these results. Some legacy handlers might simply return the `Err` object as JSON, masking the failure.

### 3.2. Architecture
*   **Domain Leakage:** `createCatalogContext` injects `inventory.repositories.product`. Catalog should be the source of truth for Products. Inventory should only hold *Stock* (referencing Product IDs). The current setup muddies the water on who owns "Product" data.
*   **Schema Gaps:** `PurchaseOrderSchema` does not support a `PARTIAL` status, but the code tries to set it (or logic implies it). This will cause Zod validation errors on partial receipts.

## 4. Evaluation Matrix

| Category | Score | Notes |
| :--- | :--- | :--- |
| **Correctness** | 🔴 Low | High risk of data inconsistency (Phantom Stock). |
| **Performance** | 🟡 Medium | N+1 queries in Inventory; Scan-based querying. |
| **Security** | 🟢 High | Good RBAC, localized auth, encrypted secrets. |
| **Maintainability** | 🟢 High | Clean Architecture, consistent patterns. |
| **Scalability** | 🟡 Medium | Deno KV is scalable, but loop-scans limit data size. |

## 5. Next Steps Plan

1.  **Refactor Inventory/Order Interactions:** Implement atomic cross-domain transactions.
2.  **Fix Race Conditions:** Add idempotency checks and unique constraint keys.
3.  **Optimize Queries:** Replace iterative queries in `StockAllocationService` with batch fetchers.
4.  **Harden Infrastructure:** Add timeouts to Connection Pool and robust error logging.
