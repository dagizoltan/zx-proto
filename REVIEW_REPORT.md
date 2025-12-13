# Deep Review: UI & Data Flow Analysis

## Executive Summary
A comprehensive static analysis of the IMS codebase has revealed critical defects preventing the proper rendering of lists across multiple domains. The primary issues stem from **signature mismatches**, **incomplete data enrichment**, and **direct infrastructure violations** in the UI layer.

## 1. Critical "Missing List" Defects

### A. Inventory: Broken Pagination & Filtering (Critical)
The Inventory List (`/ims/inventory`) is functionally broken regarding navigation and filtering.
*   **Root Cause:** Signature mismatch in `src/ctx/inventory/infrastructure/adapters/local-catalog-gateway.adapter.js`.
    *   **Call Site:** `cat.useCases.listProducts.execute(tenantId, options.limit, options.cursor)` (3 arguments).
    *   **Definition:** `createListProducts.execute(tenantId, { limit, cursor })` (2 arguments, 2nd is object).
*   **Impact:** The Use Case receives `10` (limit) as the options object. Destructuring `{ limit } = 10` results in `undefined`. The system defaults to `limit: 20` and `cursor: undefined`.
    *   **Result:** Users are stuck on Page 1. Search, Category, and Status filters are ignored.

### B. Inventory: Missing Stock Data
The Inventory Page is designed to show "Total Stock", "Reserved", and "Available".
*   **Root Cause:** `listInventoryHandler` calls `inventory.useCases.listAllProducts`, which proxies directly to `catalog.useCases.listProducts`.
*   **Impact:** The returned data contains *only* Catalog data (Name, SKU, Price). It contains **no stock information**.
*   **Result:** The "Total Stock" and "Available" columns render as empty or zero (depending on default fallback), failing the primary purpose of an Inventory system.

### C. CRM: Application Crash (Critical)
The Customers List (`/ims/crm/customers`) will throw a runtime error.
*   **Root Cause:** `listCustomersHandler` calls `ac.repositories.user.query(...)`.
*   **Defect:** The `createKVUserRepositoryAdapter` in `src/infra/persistence/kv/adapters/kv-user-repository.adapter.js` does **not expose** a `query` method. It only exposes `list`, `save`, `findById`.
*   **Result:** `TypeError: ac.repositories.user.query is not a function`. The page will render a 500 error.

### D. Orders: Missing Customer Names
The Orders List (`/ims/orders`) displays User IDs instead of Customer Names.
*   **Root Cause:**
    1.  **Field Mismatch:** UI expects `order.userId`, Domain provides `order.customerId`.
    2.  **Lack of Enrichment:** `listOrdersHandler` passes raw Order objects. There is no logic to fetch `access-control` data to resolve IDs to Names.
*   **Result:** The "Customer" column is either empty (due to field mismatch) or shows a raw UUID (if fixed), providing poor UX.

### E. Observability: Broken Log Filtering
The Logs List (`/ims/observability/logs`) fails to filter by Level (INFO, ERROR).
*   **Root Cause:** `listLogs` passes `{ level, limit, cursor }` to `repo.list`.
*   **Defect:** `repo.list` expects `{ where: { level: ... } }`. Top-level properties are ignored.
*   **Result:** All logs are shown regardless of the selected filter.

## 2. Architectural Violations

### A. UI-Infrastructure Coupling
Multiple Handlers bypass the Domain Use Cases and access Adapters (Repositories) directly. This violates Hexagonal Architecture and makes refactoring harder.
*   **Inventory:** `listWarehousesHandler` -> `inventory.repositories.warehouse.list`
*   **Inventory:** `listLocationsHandler` -> `inventory.repositories.location.query`
*   **CRM:** `listCustomersHandler` -> `ac.repositories.user.query` (which doesn't exist)

### B. Inconsistent Error Handling
*   **`unwrap()` usage:** Many handlers use `unwrap()` without `try/catch`. If a Use Case returns `Err`, the application throws an unhandled exception (500 Internal Server Error) instead of a graceful UI error message.
    *   *Example:* `listOrdersHandler`

## 3. Seed Data Observations
*   **Orders Seeding:** The seed script correctly links Orders to Customers and Products. The "missing values" in the UI are purely due to fetching logic, not data integrity.
*   **Date Patching:** The seeder manually patches `createdAt` dates. This confirms the repository supports updates, but relies on `save` (upsert) behavior.

## 4. Recommendations
1.  **Fix Inventory Gateway:** Update `local-catalog-gateway.adapter.js` to pass options as an object.
2.  **Implement CRM Query:** Add `query` method to `KVUserRepositoryAdapter` or creating a dedicated Use Case `searchUsers`.
3.  **Enrich Orders:** Implement a "Batch User Fetch" in `listOrdersHandler` or a dedicated "Order View Model" assembler.
4.  **Merge Stock Data:** Create a true `InventoryService.listStock` that fetches Products AND Stock levels, merging them before returning.
5.  **Standardize Handlers:** Refactor all handlers to call Use Cases only. Wrap Repository calls in simple Use Cases (e.g., `listWarehouses`).
