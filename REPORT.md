# System Review & Code Hygiene Report

## 1. Executive Summary

The IMS Shopfront application demonstrates a mature adherence to **Clean Architecture** principles, effectively separating domain logic, application use cases, and infrastructure. The **Admin UI** is built using a lightweight Server-Side Rendering (SSR) approach with Preact, strictly avoiding client-side framework hooks in favor of vanilla JavaScript for interactivity. This aligns well with the "No Hooks" directive.

However, a **Critical Critical Bug** was identified in the Manufacturing domain that will cause Work Order completion to fail. Additionally, there is an architectural inconsistency in how inventory stock is managed (a mix of simple scalar updates vs. complex ledger allocations).

## 2. Code Hygiene & Architecture

### 2.1 Clean Architecture Compliance
*   **Strengths**:
    *   **Layering**: Clear separation between `domain` (entities), `application` (use cases), `infra` (repositories), and `adapters` (routes/controllers).
    *   **Dependency Injection**: The system uses a functional DI approach (factory functions) found in `src/ctx/*/index.js`, allowing for easy testing and swapping of implementations.
    *   **Registry**: The `ContextRegistry` pattern allows domains to communicate (e.g., Orders accessing Inventory) without tight coupling.

*   **Weaknesses**:
    *   **Inconsistent Inventory Model**: The system maintains two parallel concepts of stock:
        1.  **Simple Model**: `Product.quantity` (Global scalar). Used by `updateStock` and likely displayed in simple lists.
        2.  **Advanced Model**: `StockRepository` entries (Product + Location + Batch) managed by `StockAllocationService`. Used by `createOrder` and `receivePurchaseOrder`.
    *   **Sync Issues**: Updating one model does not automatically update the other in all cases.

### 2.2 SSR & Frontend Patterns
*   **Compliance**: The codebase strictly adheres to the "No Hooks" rule for Admin pages. Interactivity (e.g., adding rows to an order) is correctly implemented using inline `<script>` tags with vanilla `document.addEventListener`.
*   **Security**: Scripts are injected via `dangerouslySetInnerHTML`, which is necessary for this pattern but requires strict review of input variables (e.g., `productOptions` string building) to prevent XSS. Current implementation is mostly safe but relies on manual escaping.

### 2.3 Critical Issues Identified
*   **BROKEN FEATURE**: **Complete Work Order** (`src/ctx/manufacturing/application/use-cases/wo-use-cases.js`).
    *   **The Bug**: The use case calls `inventoryService.updateStock.execute(tenantId, { productId, locationId, ... })`.
    *   **The Definition**: The `createUpdateStock` use case expects `(tenantId, productId, quantity, reason)`.
    *   **Result**: The code passes an object as the `productId` argument. The repository will fail to find the product, causing a runtime error. Work Orders cannot be completed.
*   **N+1 Queries**: `createOrder` iterates through items and performs `checkAvailability`, `getProduct`, and `reserveStock` sequentially for each item. For large orders, this will be a performance bottleneck.

## 3. Feature Inventory (Admin)

### 3.1 Catalog
| Page / Action | URL | Method | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **List Products** | `/admin/catalog` | GET | ✅ Implemented | Supports search & pagination. |
| **Create Product** | `/admin/products` | POST | ✅ Implemented | Supports Simple, Configurable, Variant types. |
| **View Product** | `/admin/products/:id` | GET | ✅ Implemented | Shows stock movements & availability. |
| **List Categories** | `/admin/categories` | GET | ✅ Implemented | |
| **Create Category** | `/admin/categories` | POST | ✅ Implemented | |
| **List Price Lists** | `/admin/price-lists` | GET | ✅ Implemented | |
| **Create Price List**| `/admin/price-lists` | POST | ✅ Implemented | |

### 3.2 Sales (Orders)
| Page / Action | URL | Method | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **List Orders** | `/admin/orders` | GET | ✅ Implemented | |
| **Create Order** | `/admin/orders` | POST | ✅ Implemented | Uses vanilla JS for dynamic line items. Validates stock. |
| **View Order** | `/admin/orders/:id` | GET | ✅ Implemented | Shows status, items, shipments. |
| **Pick List** | `/.../pick-list` | GET | ✅ Implemented | Printable view. |
| **Packing Slip** | `/.../packing-slip` | GET | ✅ Implemented | Printable view. |
| **Cancel Order** | `/.../status` | POST | ✅ Implemented | |
| **Create Shipment** | `/.../shipments` | POST | ✅ Implemented | Supports partial fulfillment. |

### 3.3 Inventory
| Page / Action | URL | Method | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard** | `/admin/inventory` | GET | ✅ Implemented | Global stock list. |
| **List Warehouses** | `/admin/warehouses` | GET | ✅ Implemented | |
| **Create Warehouse** | `/admin/warehouses` | POST | ✅ Implemented | |
| **List Locations** | `/admin/locations` | GET | ✅ Implemented | Naive search/filter (in-memory). |
| **Create Location** | `/admin/locations` | POST | ✅ Implemented | |
| **List Shipments** | `/admin/shipments` | GET | ✅ Implemented | |

### 3.4 Procurement
| Page / Action | URL | Method | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **List Suppliers** | `/admin/suppliers` | GET | ✅ Implemented | |
| **Create Supplier** | `/admin/suppliers` | POST | ✅ Implemented | |
| **List POs** | `/admin/purchase-orders` | GET | ✅ Implemented | |
| **Create PO** | `/.../purchase-orders` | POST | ✅ Implemented | Dynamic line items. |
| **Receive PO** | `/.../:id/receive` | GET/POST | ✅ Implemented | **Good Hygiene**: Uses `inventoryAdjustmentService` to correctly update granular stock. |

### 3.5 Manufacturing
| Page / Action | URL | Method | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **List BOMs** | `/admin/boms` | GET | ✅ Implemented | |
| **Create BOM** | `/admin/boms` | POST | ✅ Implemented | |
| **List Work Orders**| `/admin/work-orders` | GET | ✅ Implemented | |
| **Create Work Order**| `/admin/work-orders` | POST | ✅ Implemented | |
| **Complete WO** | `/.../:id/complete` | GET/POST | ❌ **Broken** | **CRITICAL**: Backend logic signature mismatch. Will crash. |

### 3.6 Access Control
| Page / Action | URL | Method | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **List Users** | `/admin/users` | GET | ✅ Implemented | |
| **Create User** | `/admin/users` | POST | ✅ Implemented | Registers & assigns role. |
| **List Roles** | `/admin/roles` | GET | ✅ Implemented | |
| **Create Role** | `/admin/roles` | POST | ✅ Implemented | |
| **List Customers** | `/admin/customers` | GET | ✅ Implemented | Filtered view of users. |

## 4. Discrepancies vs Roadmap (FEATURES.md)

1.  **Stock Transfers**: Listed as "Planned" (unchecked) in FEATURES.md. Confirmed missing in code.
2.  **Returns & RMAs**: Listed as "Planned". Confirmed missing.
3.  **Low Stock Alerts**: "Partial" implementation via Dashboard stats, but no automated email/alerting system found.
4.  **Integration Gaps**:
    *   The `completeWorkOrder` logic assumes raw materials are in the *same* location as the output finished good. This is a significant simplification compared to the "Location Management" feature promise.

## 5. Recommendations

1.  **Fix Manufacturing Completion**: Immediately refactor `createCompleteWorkOrder` to use `inventoryService.updateStock` correctly (or expose a `consumeStock` method) that respects Location IDs.
2.  **Unify Inventory Models**: Deprecate the direct usage of `Product.quantity` and ensure all stock views aggregate data from `StockRepository` to ensure consistency.
3.  **Optimize Order Creation**: Refactor `createOrder` to perform a bulk stock check/reservation to avoid N+1 database round-trips.
