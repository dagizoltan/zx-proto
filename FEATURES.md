# Enterprise Feature Roadmap

This document outlines the feature set targeted for the IMS Shopfront "Enterprise Edition" and tracks the current implementation status.

**Status Legend:**
- [x] **Implemented:** Core functionality exists and is usable.
- [ ] **Planned:** Feature is identified as a requirement but not yet started.
- [-] **Partial:** Feature is partially implemented or mocked (UI only).

---

## 1. Catalog Management
Centralized management of products, pricing, and organization.

- [x] **Product Management:** Support for Simple, Configurable, and Variant product types.
- [x] **Category Management:** Hierarchical category tree structure.
- [x] **Price Lists:** Custom pricing tiers (e.g., VIP, Wholesale) with currency support.
- [x] **Stock Visibility:** Real-time stock levels visible in catalog admin.
- [ ] **Advanced Attributes:** Dynamic product specifications (Color, Size, Material) beyond basic variants.
- [ ] **Digital Asset Management:** Multiple images, videos, and documents per product.
- [ ] **Bulk Operations:** Import/Export via CSV/Excel.
- [ ] **Cross-sell / Up-sell:** Related product recommendations.

## 2. Sales & Order Management (OMS)
End-to-end processing of customer orders.

- [x] **Order Processing:** Lifecycle management (Created -> Paid -> Shipped -> Delivered -> Cancelled).
- [x] **Document Generation:** Printable Pick Lists and Packing Slips.
- [x] **Order History:** Full history view for customers and admins.
- [ ] **Shipments:** Tracking split shipments and carrier integration.
- [ ] **Returns & RMAs:** Reverse logistics, refund processing, and restocking.
- [ ] **B2B Quoting:** Request for Quote (RFQ) and converting quotes to orders.
- [ ] **Subscriptions:** Recurring billing and automated order generation.

## 3. Inventory & Warehouse Management (WMS)
Precise tracking of stock across multiple locations.

- [x] **Multi-Warehouse:** Manage stock across multiple physical facilities.
- [x] **Location Management:** Hierarchical storage (Zones -> Aisles -> Bins).
- [x] **Stock Movements:** Immutable ledger of all inventory changes (Receive, Move, Ship).
- [x] **Batch & Expiry Tracking:** Traceability for perishable or regulated goods (FEFO support).
- [x] **Reservations:** Soft allocation of stock to orders before shipping.
- [ ] **Stock Transfers:** Formal process for moving stock between warehouses.
- [ ] **Stocktaking:** Cycle counting and physical inventory reconciliation tools.
- [ ] **Low Stock Alerts:** Automated notifications based on reorder points.

## 4. Procurement (P2P)
Managing the supply chain and incoming goods.

- [x] **Supplier Management:** Database of vendors and contact details.
- [x] **Purchase Orders:** Creation and lifecycle management of POs.
- [x] **Receiving:** Partial and full receiving of goods into specific warehouse locations.
- [ ] **Supplier Price Lists:** Tracking cost history and lead times per supplier.
- [ ] **Accounts Payable:** Bill matching (PO vs Receipt vs Invoice) and payment tracking.
- [ ] **Drop Shipping:** Automatically routing customer orders to suppliers.

## 5. Manufacturing (MRP)
Production planning and execution.

- [x] **Bill of Materials (BOM):** Definition of components and labor required for finished goods.
- [x] **Work Orders:** Production orders tracking component consumption and finished good output.
- [ ] **Production Scheduling:** Drag-and-drop calendar for machine/labor allocation.
- [ ] **Outsourced Manufacturing:** Tracking production at third-party contract manufacturers.
- [ ] **Disassembly:** Breaking down finished goods into components.

## 6. CRM & Customer Experience
Managing relationships and access.

- [x] **Customer Profiles:** Centralized view of customer details and order history.
- [x] **RBAC:** Role-Based Access Control (Admin, Manager, Customer) with fine-grained permissions.
- [x] **Authentication:** Secure Login/Registration with JWT.
- [ ] **Customer Groups:** Segmentation for pricing and marketing (e.g., Retail vs Wholesale).
- [ ] **Loyalty Program:** Points accrual and redemption.
- [ ] **Support Integration:** Helpdesk ticketing system connection.

## 7. System & Architecture
Foundation for scalability and security.

- [x] **Multi-Tenancy:** Data isolation by tenant ID for SaaS delivery.
- [x] **Server-Side Rendering (SSR):** Optimized for performance and SEO using Preact.
- [x] **Clean Architecture:** Strict separation of Domain, Application, and Infrastructure layers.
- [x] **Event-Driven:** Internal EventBus for decoupling domain logic (e.g., Stock -> Order updates).
- [ ] **Audit Logging:** Security log of "who did what and when" for sensitive actions.
- [ ] **API Access:** Public API with key management for third-party integrations.
- [ ] **Webhooks:** Outbound notifications for system events.
- [ ] **Localization:** Multi-language and time-zone support.
