# Deep Review Findings: IMS System Architecture

## Executive Summary
A comprehensive review of the IMS codebase (`src/`) identified significant "Refactoring Trash" and structural issues that impede maintainability and violate Clean Architecture principles. Specifically, the codebase suffers from "Dependency Hell" where Domain layers explicitly depend on Infrastructure implementation details.

## 1. Critical "Trash" Findings

### A. Multiple Repositories in Single Files
The following files violate the Single Responsibility Principle by bundling multiple unrelated repositories. This makes finding code difficult and increases file size unnecessarily.
*   **`src/infra/persistence/kv/repositories/kv-communication-repositories.js`**
    *   Contains: `Feed`, `Notification`, `Conversation`, `Message` repositories.
*   **`src/infra/persistence/kv/repositories/kv-log-repositories.js`**
    *   Contains: `Log`, `Activity` repositories.

### B. Broken Imports (Dead Code)
The following imports point to non-existent files, remnants of failed refactoring operations:
1.  `src/infra/persistence/kv/repositories/kv-audit-repository.js` -> `../../../../ctx/observability/domain/schemas/observability.schema.js`
2.  `src/ctx/communication/index.js` -> `./application/use-cases/post-feed-item.js`
3.  `src/ctx/communication/index.js` -> `./application/use-cases/send-message.js`
4.  `src/ctx/observability/index.js` -> `./domain/repositories/kv-log-repositories.js`

## 2. Architectural Violations

### A. The "Infra-Dependence" Pattern
Every single Domain Context currently imports its repository implementation directly from `src/infra`.
*   **Violation:** `src/ctx/orders/index.js` imports `createKVOrderRepository` from `../../infra/...`
*   **Impact:** The Orders Domain is hard-coupled to the "KV" implementation. You cannot test the domain without the specific KV infrastructure files.

### B. Deep Nesting Fatigue
The current structure uses deep, Java-like nesting that adds no value in a JavaScript context:
*   `src/ctx/inventory/application/use-cases/create-product.js`
*   `src/ctx/inventory/domain/schemas/product.schema.js`
*   `src/ctx/inventory/domain/services/stock-allocation-service.js`

This makes refactoring difficult (moving files requires updating 5 levels of `../..`) and makes the codebase hard to scan.

## 3. Solution Proposal

I recommend adopting the **Functional Flat Hexagonal Architecture** defined in `ARCHITECTURE_PROPOSAL.md`.

### Core Strategy
1.  **Eliminate `src/infra/persistence/kv/repositories`**: Move these files INTO their respective domains.
2.  **Flatten the Domain**:
    *   `src/ctx/{domain}/domain.js`: Contains all Schemas and Pure Logic.
    *   `src/ctx/{domain}/adapters.js`: Contains the moved Repository implementations (refactored to single exports).
    *   `src/ctx/{domain}/use-cases.js`: Contains all Use Cases for the domain.
3.  **Invert Control**:
    *   `use-cases.js` will accept repositories as arguments.
    *   `index.js` will instantiate `adapters.js` and inject them into `use-cases.js`.

### Next Steps
1.  Approve this architectural direction.
2.  Execute the migration on the `inventory` domain as a pilot.
3.  Roll out to all domains and delete `src/infra/persistence`.
