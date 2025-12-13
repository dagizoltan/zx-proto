# Refactoring Continuation Prompt

**Context:**
We are in the process of migrating the IMS codebase to a Functional Hexagonal Architecture. The `orders`, `inventory`, `catalog`, `manufacturing`, and `procurement` contexts have been successfully refactored.

**Goal:**
Refactor the remaining contexts to align with the "Functional Flat Hexagonal" standard defined in `ARCHITECTURE_PROPOSAL.md`.

**Remaining Tasks:**

1.  **Communication Context (`src/ctx/communication`)**
    *   **Current State:** Uses direct legacy repositories (`feed`, `notification`, `conversation`, `message`) in `src/infra/persistence/kv/repositories/`.
    *   **Action:**
        *   Create `infrastructure/adapters/` and move repository logic there (e.g., `kv-feed-repository.adapter.js`).
        *   Define pure domain entities in `domain/entities/` (if not already present or if they are "anemic").
        *   Create Zod schemas and Mappers in `infrastructure/persistence/`.
        *   Update `index.js` to inject the new adapters.
        *   Delete legacy repository files.

2.  **Observability Context (`src/ctx/observability`)**
    *   **Current State:** Uses direct legacy repositories (`log`, `activity`, `audit`).
    *   **Action:**
        *   Refactor to Ports/Adapters.
        *   Note: This context is critical for system monitoring, so ensure no telemetry is lost during migration.

3.  **Scheduler Context (`src/ctx/scheduler`)**
    *   **Current State:** Uses direct repositories (`task`, `execution`) and is service-heavy.
    *   **Action:**
        *   Separate infrastructure concerns (persistence) from the scheduling logic.
        *   Create adapters for Task and Execution repositories.

**Architecture Reference:**
*   **Directory Structure:**
    ```text
    src/ctx/{domain}/
    ├── domain/
    │   └── entities/ (Pure Factory Functions)
    ├── infrastructure/
    │   ├── adapters/ (Repository Implementations)
    │   └── persistence/
    │       ├── mappers/ (Domain <-> Persistence)
    │       └── schemas/ (Zod Schemas)
    ├── application/
    │   └── use-cases/
    └── index.js (Dependency Injection / Wiring)
    ```
*   **Key Rules:**
    *   No direct imports of `src/infra` in Domain or Application layers.
    *   Domain entities must be pure (no side effects, no database dependencies).
    *   Adapters must satisfy implied interfaces (methods like `save`, `findById`).

**Verification:**
*   Ensure backward compatibility (restore `delete`, `findByIds` if used).
*   Verify logic with smoke tests or script verification.
