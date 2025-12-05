# Route Audit Report

This report provides a comprehensive list of all verified Admin Routes (UI and API) in the system, detailing their HTTP Method, Path, and the associated Business Logic (Use Case or Repository call).

## 1. Admin UI Routes (`src/adapters/http/ui/routes/admin/`)

Base Path: `/admin` (Mounted in `src/adapters/http/ui/routes/admin-routes.js`)

### Domain: Dashboard & Core
| Method | Path | Use Case / Logic | Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard` | `orders.useCases.getDashboardStats` + `listOrders` | ✅ Verified |
| `GET` | `/warehouses` | Redirect -> `/admin/inventory/warehouses` | ✅ Verified |
| `GET` | `/locations` | Redirect -> `/admin/inventory/locations` | ✅ Verified |
| `GET` | `/products` | Redirect -> `/admin/catalog` | ✅ Verified |
| `GET` | `/boms` | Redirect -> `/admin/manufacturing/boms` | ✅ Verified |
| `GET` | `/work-orders` | Redirect -> `/admin/manufacturing/work-orders` | ✅ Verified |
| `GET` | `/suppliers` | Redirect -> `/admin/procurement/suppliers` | ✅ Verified |
| `GET` | `/purchase-orders` | Redirect -> `/admin/procurement/purchase-orders` | ✅ Verified |

### Domain: Catalog (`/catalog`)
| Method | Path | Use Case / Logic | Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | `catalog.useCases.searchProducts` OR `listProducts` | ✅ Verified |
| `GET` | `/products/new` | `catalog.useCases.listCategories` + `listPriceLists` (Form Data) | ✅ Verified |
| `POST` | `/products` | `catalog.useCases.createProduct` | ✅ Verified |
| `GET` | `/products/:id` | `inventory.useCases.getProduct` + `listStockMovements` | ✅ Verified |
| `GET` | `/categories` | `catalog.useCases.listCategories` | ✅ Verified |
| `GET` | `/categories/new` | `catalog.useCases.listCategories` (Parent Selection) | ✅ Verified |
| `POST` | `/categories` | `catalog.useCases.createCategory` | ✅ Verified |
| `GET` | `/categories/:id` | `catalog.repositories.category.findById` + `listCategories` (Subcats) | ✅ Verified |
| `GET` | `/price-lists` | `catalog.useCases.listPriceLists` | ✅ Verified |
| `GET` | `/price-lists/new` | Render Form | ✅ Verified |
| `POST` | `/price-lists` | `catalog.useCases.createPriceList` | ✅ Verified |
| `GET` | `/price-lists/:id` | `catalog.repositories.priceList.findById` | ✅ Verified |

### Domain: Orders (`/orders`)
| Method | Path | Use Case / Logic | Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | `orders.useCases.listOrders` | ✅ Verified |
| `GET` | `/new` | `accessControl.useCases.listUsers` + `catalog.useCases.listProducts` | ✅ Verified |
| `POST` | `/` | `orders.useCases.createOrder` | ✅ Verified |
| `GET` | `/:id` | `orders.useCases.getOrder` + `listShipments` | ✅ Verified |
| `POST` | `/:id/status` | `orders.useCases.updateOrderStatus` | ✅ Verified |
| `GET` | `/:id/pick-list` | `orders.useCases.getOrder` + `inventory.repositories.stockMovement.getByReference` | ✅ Verified |
| `GET` | `/:id/packing-slip` | `orders.useCases.getOrder` | ✅ Verified |
| `GET` | `/:id/shipments/new` | `orders.useCases.getOrder` (Form Data) | ✅ Verified |
| `POST` | `/:id/shipments` | `orders.useCases.createShipment` | ✅ Verified |

### Domain: Inventory (`/inventory`)
| Method | Path | Use Case / Logic | Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | `inventory.useCases.listAllProducts` (Stock Dashboard) | ✅ Verified |
| `GET` | `/warehouses` | `inventory.repositories.warehouse.findAll` | ✅ Verified |
| `GET` | `/warehouses/new` | Render Form | ✅ Verified |
| `POST` | `/warehouses` | `inventory.repositories.warehouse.save` | ✅ Verified |
| `GET` | `/warehouses/:id` | `inventory.repositories.warehouse.findById` + `location.findByWarehouseId` | ✅ Verified |
| `GET` | `/locations` | `inventory.repositories.warehouse.findAll` + `location.findByWarehouseId` (Loop) | ✅ Verified |
| `GET` | `/locations/new` | `inventory.repositories.warehouse.findAll` (Selection) | ✅ Verified |
| `POST` | `/locations` | `inventory.repositories.location.save` | ✅ Verified |
| `GET` | `/locations/:id` | `inventory.repositories.location.findById` | ✅ Verified |

### Domain: Procurement (`/procurement`)
| Method | Path | Use Case / Logic | Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/suppliers` | `procurement.useCases.listSuppliers` | ✅ Verified |
| `GET` | `/suppliers/new` | Render Form | ✅ Verified |
| `POST` | `/suppliers` | `procurement.useCases.createSupplier` | ✅ Verified |
| `GET` | `/suppliers/:id` | `procurement.repositories.supplier.findById` + `listPurchaseOrders` | ✅ Verified |
| `GET` | `/purchase-orders` | `procurement.useCases.listPurchaseOrders` | ✅ Verified |
| `GET` | `/purchase-orders/new` | `procurement.useCases.listSuppliers` + `catalog.useCases.listProducts` | ✅ Verified |
| `POST` | `/purchase-orders` | `procurement.useCases.createPurchaseOrder` | ✅ Verified |
| `GET` | `/purchase-orders/:id` | `procurement.useCases.getPurchaseOrder` | ✅ Verified |
| `GET` | `/purchase-orders/:id/receive` | `getPurchaseOrder` + `warehouse.findAll` (Form) | ✅ Verified |
| `POST` | `/purchase-orders/:id/receive` | `procurement.useCases.receivePurchaseOrder` | ✅ Verified |

### Domain: Manufacturing (`/manufacturing`)
| Method | Path | Use Case / Logic | Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/boms` | `manufacturing.useCases.listBOMs` | ✅ Verified |
| `GET` | `/boms/new` | `catalog.useCases.listProducts` (Selection) | ✅ Verified |
| `POST` | `/boms` | `manufacturing.useCases.createBOM` | ✅ Verified |
| `GET` | `/boms/:id` | `manufacturing.repositories.bom.findById` | ✅ Verified |
| `GET` | `/work-orders` | `manufacturing.useCases.listWorkOrders` | ✅ Verified |
| `GET` | `/work-orders/new` | `manufacturing.useCases.listBOMs` (Selection) | ✅ Verified |
| `POST` | `/work-orders` | `manufacturing.useCases.createWorkOrder` | ✅ Verified |
| `GET` | `/work-orders/:id` | `manufacturing.repositories.workOrder.findById` | ✅ Verified |
| `POST` | `/work-orders/:id/complete` | `manufacturing.useCases.completeWorkOrder` OR Render Form | ✅ Verified |

### Domain: Access Control (`/`)
*Note: Mounted at root of `/admin`, so paths are relative to `/admin`*

| Method | Path | Use Case / Logic | Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | `accessControl.useCases.listUsers` | ✅ Verified |
| `GET` | `/users/new` | `listRoles` (Form) | ✅ Verified |
| `POST` | `/users` | `registerUser` + `assignRole` | ✅ Verified |
| `GET` | `/users/:id` | `user.findById` | ✅ Verified |
| `GET` | `/roles` | `accessControl.useCases.listRoles` | ✅ Verified |
| `GET` | `/roles/new` | Render Form | ✅ Verified |
| `POST` | `/roles` | `accessControl.useCases.createRole` | ✅ Verified |
| `GET` | `/roles/:id` | `role.findById` | ✅ Verified |
| `GET` | `/customers` | `listUsers` (Limit 50) | ✅ Verified |
| `GET` | `/customers/new` | Render Form | ✅ Verified |
| `POST` | `/customers` | `registerUser` + `assignRole` (Customer) | ✅ Verified |
| `GET` | `/customers/:id` | `accessControl.useCases.getCustomerProfile` | ✅ Verified |

### Domain: Shipments (`/shipments`)
| Method | Path | Use Case / Logic | Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | `orders.useCases.listShipments` | ✅ Verified |
| `GET` | `/:id` | `orders.repositories.shipment.findById` | ✅ Verified |

---

## 2. Admin API Routes (`src/adapters/http/api/routes/admin-routes.js`)

Base Path: `/api/admin` (Mounted in `src/adapters/http/api/app.js` -> `src/adapters/http/server.js`)

**Security:** Middleware enforces `authMiddleware` + `RBAC` (User must have 'admin' or 'manager' role).

| Method | Path | Use Case | Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | `accessControl.useCases.listUsers` | ✅ Verified |
| `POST` | `/users/:id/roles` | `accessControl.useCases.assignRole` | ✅ Verified |
| `GET` | `/roles` | `accessControl.useCases.listRoles` | ✅ Verified |
| `POST` | `/roles` | `accessControl.useCases.createRole` | ✅ Verified |
| `GET` | `/customers` | `accessControl.useCases.listUsers` (Note: Logic identical to users list in code) | ✅ Verified |
| `GET` | `/customers/:id` | `accessControl.useCases.getCustomerProfile` | ✅ Verified |

## 3. Summary & Observations

*   **Coverage:** The Admin UI provides complete coverage for CRUD operations across all domains (Catalog, Orders, Inventory, Manufacturing, Procurement, Access Control).
*   **Consistency:** Most UI routes follow a standard pattern: List (`/`), Create Form (`/new`), Create Action (`POST /`), Detail (`/:id`).
*   **API Gaps:** The JSON API (`/api/admin`) is currently limited to **Access Control** (Users/Roles/Customers). It lacks endpoints for Catalog, Inventory, Orders, etc. If the goal is a "Headless" admin, the API needs significant expansion.
*   **Legacy Redirects:** Several root-level admin paths (e.g., `/admin/products`) redirect to organized sub-paths (e.g., `/admin/catalog`), ensuring backward compatibility while enforcing a clean structure.
