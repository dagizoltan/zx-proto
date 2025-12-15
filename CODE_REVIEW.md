# Code Review Report

## Executive Summary

The application follows a clean **Modular Monolith** architecture with clear separation between Domain Contexts (`src/ctx/*`) and Infrastructure (`src/infra/*`). The use of **Hono** for the web layer and **Deno** for the runtime is modern and efficient.

However, several inconsistencies and critical issues were found during the deep trace of the routes and contexts. The most significant issue is the **misplacement of Audit Log logic**, leading to broken endpoints. There are also missing features (Category Management) and potential security gaps in the multi-tenancy implementation.

---

## 1. Critical Issues (Must Fix)

### 1.1. Broken Audit Log Endpoint & Architecture Mismatch
*   **Location**: `src/adapters/http/api/routes/system.routes.js`, `src/adapters/http/api/middleware/audit-middleware.js`
*   **Issue**:
    *   The API routes (`GET /system/audit-logs`) and middleware try to access `domain.system.repositories.audit` and `domain.system.useCases.listAuditLogs`.
    *   The `System` context **does not** contain these. They were moved to the `Observability` context.
    *   **Impact**: `GET /system/audit-logs` crashes. Audit middleware fails to save logs (fails silently due to catch block, but data is lost).
*   **Fix**:
    *   Update `audit-middleware.js` to use `domain.observability`.
    *   Update `system.routes.js` (or move the route to `observability.routes.js`) to use `domain.observability`.

### 1.2. Missing Category Management APIs
*   **Location**: `src/ctx/catalog` and `src/adapters/http/api/routes/catalog.routes.js`
*   **Issue**:
    *   The `Catalog` context has a `createCategory` use case, but there is **no API endpoint** exposed to create, update, or delete categories.
    *   **Impact**: Users cannot manage categories via the API.
*   **Fix**: Add `POST /catalogs/categories` and other CRUD endpoints.

### 1.3. Tenant Middleware Security Gap
*   **Location**: `src/adapters/http/middleware/tenant-middleware.js`
*   **Issue**:
    *   The middleware blindly trusts `x-tenant-id` header if no Auth token is present. While acceptable for public endpoints, it poses a risk if any internal logic relies on `tenantId` being verified.
    *   **Impact**: Potential for tenant spoofing on unauthenticated routes (or if auth is bypassed).
*   **Fix**: Ensure downstream contexts verify tenant existence if strictly required, or sign the tenant ID context.

---

## 2. Code Inconsistencies & improvements

### 2.1. Registration Inefficiency
*   **Location**: `src/ctx/access-control/application/use-cases/register-user.js`
*   **Issue**: The code hashes the password *before* checking if the user already exists.
*   **Improvement**: Move the "Check User Existence" step before the "Hash Password" step to save CPU cycles on failed registrations.

### 2.2. Error Handling Pattern
*   **Location**: various handlers (e.g., `src/adapters/http/api/handlers/auth/login.handler.js`)
*   **Issue**: The use of `unwrap(...)` inside handlers throws a generic error. In `loginHandler`, this is caught and turned into a 401. This is secure but complicates debugging (internal DB errors look like "Invalid Credentials").
*   **Improvement**: Log the specific error before returning the generic 401.

### 2.3. Inventory Compatibility Layer
*   **Location**: `src/ctx/inventory/index.js`
*   **Observation**: The inventory context is highly complex with many compatibility adapters (`reserveStockCompat`, etc.). This indicates a transition phase.
*   **Recommendation**: Monitor this closely. Future refactoring should aim to update consumers (Orders, Manufacturing) to use the new `stockAllocationService` signature directly, removing the need for adapters.

---

## 3. Detailed Trace Findings

### Auth & Access Control
*   **Routes**: `POST /login`, `POST /register`
*   **Status**: **Good**. Use cases correctly implement logic. Validation middleware is present.

### Catalog
*   **Routes**: `GET /products`, `POST /products`
*   **Status**: **Mixed**. Products working well. Categories missing write operations.

### Orders
*   **Routes**: `POST /orders`, `GET /orders`
*   **Status**: **Excellent**. Robust saga-like pattern implemented (Order Save failure triggers Stock Release).

### System vs. Observability
*   **Routes**: `GET /system/audit-logs`, `GET /observability/audit`
*   **Status**: **Conflict**. Duplicate/Broken routes. `observability` is the correct source of truth.

---

## 4. Remediation Plan

1.  **Refactor Audit Middleware**: Point to `domain.observability`.
2.  **Fix System Routes**: Remove broken audit routes from `system` and ensure `observability` routes are primary.
3.  **Implement Category APIs**: Add missing routes to `catalog.routes.js`.
4.  **Optimize Register**: Swap order of operations in `register-user.js`.
