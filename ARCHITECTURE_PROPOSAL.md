# Architecture Proposal: Functional Flat Hexagonal

## Overview
This document defines the architectural standard for the IMS system. The goal is to eliminate circular dependencies, reduce boilerplate, and enforce strict separation of concerns using a **Functional Programming** style within a **Flat Hexagonal** directory structure.

## Core Principles
1.  **Hexagonal (Ports & Adapters)**: Domain logic is isolated from Infrastructure.
2.  **Functional**: No Classes (`class`). Use Factory Functions and Closures.
3.  **Flat**: Minimize directory nesting. Group by "Role" (Adapter vs Use Case) rather than "Layer" (Application vs Domain).
4.  **Explicit Dependency Injection**: All dependencies are passed as arguments to Factory Functions.

## Directory Structure: `src/ctx/{domain}/`

Each domain (Context) is self-contained in a single folder with the following standard files:

```text
src/ctx/inventory/
├── domain.js        # THE CORE: Schemas, Errors, Pure Functions
├── use-cases.js     # THE APP: Application Logic (Primary Ports)
├── adapters.js      # THE INFRA: Repository Implementations (Secondary Adapters)
└── index.js         # THE WIRING: Composition Root
```

### 1. `domain.js` (Pure Domain)
Contains **Data Structures** (Zod Schemas), **Domain Errors**, and **Pure Domain Logic**.
*   **Dependencies**: None (or other local domain files).
*   **Style**: Pure functions, Zod objects.

```javascript
import { z } from 'zod';

// --- Schemas ---
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  price: z.number()
});

// --- Pure Logic ---
export const calculateTax = (product, rate) => {
  return product.price * rate;
};

// --- Domain Services (Pure) ---
// If logic is complex but stateless
export const createPricingService = () => {
  const getPrice = (product) => product.price;
  return { getPrice };
};
```

### 2. `adapters.js` (Infrastructure)
Contains **Repository Implementations** and **External Adapters**.
*   **Dependencies**: `domain.js` (for Schemas), External Libs (`lib/trust`, `kvPool`).
*   **Style**: Factory Functions returning Objects with Methods.

```javascript
import { createRepository, useSchema } from '../../../lib/trust/index.js'; // Note relative path
import { ProductSchema } from './domain.js';

// --- KV Repository ---
export const createKVProductRepository = (kvPool) => {
  // Use Trust Platform or raw KV
  const repo = createRepository(kvPool, 'products', [
      useSchema(ProductSchema)
  ]);

  return {
    save: (tenantId, product) => repo.save(tenantId, product),
    findById: (tenantId, id) => repo.findById(tenantId, id)
  };
};

// --- External Adapter ---
export const createStripeAdapter = (apiKey) => {
  return {
    charge: async (amount) => { /* ... */ }
  };
};
```

### 3. `use-cases.js` (Application Logic)
Contains **All Use Cases** for the domain.
*   **Dependencies**: `domain.js` (Schemas), Injected Adapters (Repositories).
*   **Style**: Higher-Order Factory Functions. `(deps) => (input) => Result`.

```javascript
import { ProductSchema } from './domain.js';
import { Ok, Err } from '../../../lib/trust/result.js'; // Functional Result Type

// --- Factory for All Use Cases ---
// This allows sharing deps across use cases if desired, or individual factories
export const createUseCases = ({ productRepo, eventBus }) => {

  const createProduct = async (tenantId, input) => {
    // 1. Validation
    const product = ProductSchema.parse({ ...input, id: crypto.randomUUID() });

    // 2. Persistence
    const result = await productRepo.save(tenantId, product);
    if (!result.ok) return Err(result.error);

    // 3. Events
    await eventBus.publish('product.created', product);

    return Ok(product);
  };

  const getProduct = async (tenantId, id) => {
    return productRepo.findById(tenantId, id);
  };

  return {
    createProduct,
    getProduct
  };
};
```

### 4. `index.js` (Composition Root)
Wires everything together. This is the **Only** place where `adapters.js` is imported by name.

```javascript
import * as Domain from './domain.js';
import * as Adapters from './adapters.js';
import { createUseCases } from './use-cases.js';

export const createInventoryContext = async (deps) => {
  const { persistence, messaging } = deps;

  // 1. Instantiate Adapters
  const productRepo = Adapters.createKVProductRepository(persistence.kvPool);

  // 2. Instantiate Use Cases (Injecting Adapters)
  const useCases = createUseCases({
    productRepo,
    eventBus: messaging.eventBus
  });

  // 3. Return Context
  return {
    name: 'inventory',
    useCases, // Public API
    schemas: Domain, // Optional: Expose schemas if needed
    // NOTE: Repositories are NOT exposed unless strictly necessary for legacy reasons
  };
};
```

## Migration Strategy (Refactoring "Trash")

1.  **Consolidate Repositories**: Split multi-repo files (`kv-communication-repositories.js`) into individual exports in `src/ctx/{domain}/adapters.js`.
2.  **Move & Rename**:
    *   `src/infra/persistence/kv/repositories/kv-order-repository.js` -> `src/ctx/orders/adapters.js` (as `createKVOrderRepository`).
    *   `src/ctx/orders/domain/schemas/*.js` -> `src/ctx/orders/domain.js`.
    *   `src/ctx/orders/application/use-cases/*.js` -> `src/ctx/orders/use-cases.js`.
3.  **Fix Dependencies**: Update `index.js` to wire the local adapters.
4.  **Clean Up**: Delete the empty `src/infra` folders and `src/ctx/*/application` folders.

## Handling Cross-Domain Dependencies
Domains do **not** import each other's files. Use Dependency Injection in the Root (`main.js` or `index.js`).

If `Orders` needs `Inventory`:
1.  `Orders` Use Cases declare a dependency: `inventoryGateway`.
2.  `Orders` Context (`index.js`) extracts `inventory` from `deps.registry`.
3.  Pass `inventory.useCases` (or a subset) as the `inventoryGateway`.

## Handling "Infra Services" (Complex Logic with DB)
Services that mix Domain Logic + DB Access (e.g., `StockAllocationService`) are treated as **Adapters** or **Specialized Use Cases**.
*   **Location**: `adapters.js` (if it feels like a DB extension) or `use-cases.js` (if it feels like a flow).
*   **Recommendation**: `adapters.js` -> `export const createStockAllocator = (repo) => { ... }`.
