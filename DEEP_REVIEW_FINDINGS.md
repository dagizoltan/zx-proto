# Deep Review Findings: IMS System Architecture

## Executive Summary
A comprehensive review of the codebase reveals significant architectural deviations from Clean Architecture principles. The primary issues are strict dependency violations where the Domain layer directly imports Infrastructure components, "Refactoring Trash" in the form of multiple repositories in single files and broken imports, and a lack of clear separation for repository interfaces.

## 1. Structural Violations

### Multiple Repositories in Single Files
Several files in `src/infra` contain multiple repository definitions, which violates the Single Responsibility Principle and makes the code harder to navigate.

*   **`src/infra/persistence/kv/repositories/kv-communication-repositories.js`**
    *   Exports: `createKVFeedRepository`, `createKVNotificationRepository`, `createKVConversationRepository`, `createKVMessageRepository`
*   **`src/infra/persistence/kv/repositories/kv-log-repositories.js`**
    *   Exports: `createKVLogRepository`, `createKVActivityRepository`

### Broken & Missing Imports ("Trash")
There are explicit imports pointing to files that do not exist, likely remnants of a previous refactoring or failed file moves.

*   **`src/infra/persistence/kv/repositories/kv-audit-repository.js`**
    *   Import: `../../../../ctx/observability/domain/schemas/observability.schema.js` (File does not exist)
*   **`src/ctx/communication/index.js`**
    *   Import: `./application/use-cases/post-feed-item.js` (File does not exist)
    *   Import: `./application/use-cases/send-message.js` (File does not exist)
*   **`src/ctx/observability/index.js`**
    *   Import: `./domain/repositories/kv-log-repositories.js` (File does not exist - likely intended to be the infra file)

## 2. Dependency Architecture Violations

### Domain Importing Infrastructure (Critical)
The codebase systematically violates the Dependency Rule (Source Code dependencies must point only inward, towards Domain). Currently, `src/ctx` (Domain) directly imports factory functions from `src/infra`.

**Evidence:**
*   `src/ctx/access-control/index.js` imports `createKVUserRepository` from `../../infra`
*   `src/ctx/catalog/index.js` imports `createKVProductRepository` from `../../infra`
*   `src/ctx/orders/index.js` imports `createKVOrderRepository` from `../../infra`
*   *Note: This pattern is repeated across ALL domains (inventory, manufacturing, procurement, etc.).*

**Impact:** The Domain layer is now tightly coupled to the specific Key-Value implementation in `infra`. It is impossible to test the Domain in isolation or swap out the persistence layer without modifying Domain code.

### Domain Importing Adapters
*   `src/ctx/scheduler/index.js` imports `schedulerTaskHandlers` from `src/adapters/scheduler/task-handlers.js`.
*   **Impact:** Domain logic depends on the specific adapter implementation of tasks.

## 3. Repositories in Domain vs. Infra
The user correctly identified that "repositories rely on domains" (Infra imports Domain Schemas), which is actually valid in Clean Architecture. However, the *inverse* (Domain imports Infra Repository Implementation) is the major issue observed here.

The user expressed a desire for repositories to "live in domain".
*   **Current State:** Repositories are concrete implementations in `src/infra` using `lib/trust`.
*   **Problem:** There are no abstract interfaces in the Domain. The Domain simply expects the concrete KV implementation.

## 4. Proposal for Refactoring

To resolve "Dependency Hell" and clean up the structure, I propose the following plan:

### Phase 1: Structural Cleanup (The "Trash" Removal)
1.  **Split Multi-Repo Files:** Break `kv-communication-repositories.js` and `kv-log-repositories.js` into individual files (e.g., `kv-feed.repository.js`, `kv-notification.repository.js`).
2.  **Fix Broken Imports:** Resolve the missing imports in `communication` and `observability` by finding the correct files or deleting the dead code.

### Phase 2: Inversion of Control (Fixing Dependencies)
We need to decouple Domain from Infra.

**Strategy: "Gateways" in Domain**
Instead of `src/ctx/{domain}` importing `src/infra/...`, we will move the *definition* of the repository requirement to the domain, and inject the implementation at the application entry point (Composition Root).

**Option A: Colocation (User Preferred?)**
Move the repository implementations into the domain folder structure, but treat them as "Infra within Domain".
*   New Path: `src/ctx/orders/infra/repositories/kv-order.repository.js`
*   *Pros:* Keeps everything related to "Orders" in one place.
*   *Cons:* Technically mixes layers, but often pragmatic for Modular Monoliths.

**Option B: Dependency Injection (Standard)**
1.  Remove all `import { createKV... } from '../../infra'` lines from `src/ctx/*/index.js`.
2.  Update `create{Domain}Context` to accept `repositories` as a dependency in `deps`, rather than creating them inside.
3.  Move the instantiation of Repositories to `src/main.js` (or a `container.js`) and pass them *into* the Domain Context.

**Recommended Approach: Option B + Option A Hybrid**
1.  Move repository *files* to `src/ctx/{domain}/infra/persistence/` to satisfy the "Repo should live in Domain" desire (Vertical Slice Architecture).
2.  Update imports so `src/ctx/{domain}/index.js` imports from its own `./infra` folder (relative import).
3.  This removes the `../../infra` import, making the Domain self-contained (Vertical Slice), while still keeping the implementation technically in an "infra" subfolder of the domain.

### Phase 3: Standardization
1.  Ensure all imports of Schemas in Repositories are correct relative imports.
2.  Standardize naming: `*.repository.js`.

## Action Plan
1.  **Refactor**: Split `kv-communication-repositories.js` and `kv-log-repositories.js`.
2.  **Move**: Relocate all `src/infra/persistence/kv/repositories/*.js` files into their respective Domain directories (e.g., `src/ctx/orders/infra/repositories/`).
3.  **Update**: Rewrite `src/ctx/*/index.js` to import from local `./infra/repositories/...` instead of `../../infra`.
4.  **Clean**: Remove broken imports and unused code.
