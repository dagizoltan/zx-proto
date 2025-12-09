# IMS System Evaluation & Action Plan

This document outlines the findings from the system review and provides a list of actionable tasks to improve architecture, performance, and functionality.

## 1. Infrastructure & Core Architecture

### Technical Debt
- [ ] **[Infra] Optimize KV Connection Pool**
  - **Issue:** `src/infra/persistence/kv/kv-connection-pool.js` uses a `while` loop with `setTimeout` (spin-lock) to wait for available connections. This burns CPU and latency.
  - **Action:** Replace with a `Promise`-based queue or `Promise.withResolvers` to handle connection acquisition efficiently.
- [ ] **[Infra] Fix N+1 in Base Repository `findAll`**
  - **Issue:** `createBaseRepository.findAll` iterates the entire KV list into memory (`items.push`) before returning, even if only a page is needed (though limit is passed to `kv.list`, filtering often happens in memory in derived repos).
  - **Action:** Ensure all repositories pass `limit` and `cursor` down to the KV layer. Implement a true streaming interface or generator for large data exports.
- [ ] **[Architecture] Decouple Inventory from Product Details**
  - **Issue:** `Inventory` domain exposes `getProduct` and `getProductsBatch` which seem to return full product details (name, price). This violates boundary; `Catalog` should own product metadata.
  - **Action:** Refactor `Inventory` to only store/return stock levels. UI/Orchestrators should fetch metadata from `Catalog` and stock from `Inventory` separately or via a dedicated "BFF" (Backend for Frontend) aggregator (like the `queries` domain).

## 2. Domain: Inventory & Manufacturing

### Functional & Technical
- [ ] **[Inventory] Fix N+1 in Pick List Generation**
  - **Issue:** `pickListHandler` in `order.handlers.js` iterates stock movements and fetches Product, Location, and Batch for *each* item individually.
  - **Action:** Refactor to use `getBatch` methods (e.g., `catalog.useCases.getProductsByIds`, `inventory.useCases.getLocationsByIds`).
- [ ] **[Manufacturing] Implement Atomic Batch Reception for POs**
  - **Issue:** `receivePurchaseOrder` iterates items and calls `inventoryService.receiveStockRobust` in a loop. A failure mid-loop leaves the PO in an inconsistent state.
  - **Action:** Create `inventoryService.receiveBatchStock` to handle multiple items in a single atomic transaction.

## 3. Domain: Orders & Fulfillment

### Functional
- [ ] **[Orders] Fix User Dropdown Scalability**
  - **Issue:** `CreateOrderPage` fetches all users (`limit: 100`) for the customer dropdown. This will break for >100 users.
  - **Action:** Replace dropdown with an async autocomplete/search field (HTMX or custom JS) calling a user search API.
- [ ] **[Orders] Enforce Strict Product Price Source**
  - **Issue:** `createOrder` fetches prices via `inventory.useCases.getProductsBatch`.
  - **Action:** Switch this to `catalog.useCases.getProductsBatch` to ensure the source of truth for pricing is respected.

## 4. Domain: Communication & System

### Functional
- [ ] **[Communication] Pagination for Conversation Messages**
  - **Issue:** `messageRepository.listByConversation` is hardcoded to 100 messages.
  - **Action:** Implement cursor-based pagination for the chat UI to support long histories.
- [ ] **[System] Add Structured Logging for Errors**
  - **Issue:** Many `try/catch` blocks in UI handlers just return generic 400/500 text without structured context logging.
  - **Action:** Standardize on `obs.error(message, { stack, ...context })` in all catch blocks.

## 5. UI/UX Enhancements

### Usability
- [ ] **[UX] Dynamic Customer Search**
  - **Context:** Linked to the Orders scalability issue.
  - **Action:** Implement a generic "Entity Search" component for forms (Users, Products) to handle large datasets.
- [ ] **[UX] Improve Error Feedback**
  - **Issue:** Some handlers return raw text on error.
  - **Action:** Ensure all POST handlers re-render the form with the `error` prop and preserved `values` (Input Restoration).

## 6. Security

### Review
- [ ] **[Security] Audit Public API Endpoints**
  - **Issue:** `catalogRoutes` exposes public read access.
  - **Action:** Confirm if this is intended (B2B store vs internal tool). If internal, enforce `authMiddleware` globally.
- [ ] **[Security] Rate Limiting on Login**
  - **Action:** Ensure `rate-limit.js` is strictly applied to `auth.routes.js` to prevent brute force (verified as present, but needs testing).
