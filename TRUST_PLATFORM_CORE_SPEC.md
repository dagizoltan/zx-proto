# Trust Platform Core: Technical Specification (v2.0)

**Date:** October 26, 2024
**Status:** DRAFT / FINAL ARCHITECTURE
**Context:** General Purpose High-Trust Data Engine
**Target:** Multi-System Reusability (Replace Redis, Mongo, Blockchain Clients)

---

## 1. Executive Summary
The **Trust Platform Core** is a modular, functional data engine built on Deno KV. It is designed to be the foundational persistence layer for multiple future systems, ranging from simple caches to high-compliance RegTech platforms.

**Strategic Goals:**
1.  **Unified Stack:** Replace Redis (Cache), MongoDB (Document Store), and SQL (Relational) with a single, highly capable Deno KV abstraction.
2.  **Plugin Architecture:** Core logic is minimal; capabilities (Encryption, Versioning, Auditing) are injected as middleware.
3.  **Backend Agnostic:** Run in-memory (Test/Cache), on-disk (Local/IoT), or globally distributed (Enterprise/SaaS) without code changes.

---

## 2. Architecture: The Plugin Pipeline

The Core is built around the concept of a **Composable Pipeline**. There is no monolithic "Repository Class". There is only a `save` function composed of middleware.

### 2.1. The Composition Pattern

```javascript
import { createRepository, useSchema, useEncryption, useVersionedChain } from '@trust/core';

const PatientRepo = createRepository(kv, [
  // 1. Validation (Schema)
  useSchema(PatientSchema),

  // 2. Security (HIPAA)
  useEncryption({ provider: 'kms', keyId: 'tenant-key' }),

  // 3. Integrity (Blockchain)
  useVersionedChain({ tier: 'Chain' }),

  // 4. Observability
  useTelemetry({ span: 'patient.save' })
]);
```

### 2.2. Middleware Interface
Each plugin is a higher-order function that wraps the `next()` operation.

```javascript
// Example: Encryption Plugin (Functional)
const useEncryption = (config) => (next) => async (ctx, data) => {
    const encrypted = await encrypt(data, config);
    const result = await next(ctx, encrypted);
    return decrypt(result, config); // Transparent on read
};
```

---

## 3. Deployment Modes (The "Redis Killer")

Because Deno KV supports multiple backends, this engine can replace multiple infrastructure pieces.

| Mode | Backend | Use Case | Replaces |
| :--- | :--- | :--- | :--- |
| **Ephemeral** | `:memory:` | Rate Limiting, Session Store, Job Queues | **Redis / Memcached** |
| **Edge** | `Deno Deploy` | Global SaaS, Multi-Tenant Platform | **DynamoDB / CosmosDB** |
| **Local** | `SQLite` | IoT Edge Devices, On-Premise Enterprise | **Embedded SQL** |

### 3.1. "Ephemeral Chain" Configuration
For high-frequency systems (e.g., Sensor Data), we can run an **In-Memory Ledger**.
*   **Throughput:** 10k+ ops/sec (Memory speed).
*   **Integrity:** Uses the same Hashing/Chaining logic as the Persistent Chain.
*   **Durability:** Periodically "Snapshots" the Merkle Root to a durable layer (Disk/Cloud).

---

## 4. Feature Specifications

### 4.1. Advanced Indexing (Nested & Sparse)
*   **Nested:** Supports `fields: ['profile.address.city']` via key flattening.
*   **Sparse:** `filter: (doc) => doc.status === 'ACTIVE'` allows indexing only a subset of data to save storage/cost.

### 4.2. Materialized Views (Async Aggregation)
*   **Mechanism:** Uses `Deno KV Queues` to decouple write-latency from analytics.
*   **Definition:** `defineView({ map: ..., reduce: ... })`.
*   **Result:** Real-time dashboards with O(1) read cost.

### 4.3. Compliance (HIPAA / GDPR)
*   **Envelope Encryption:** Implemented as a standard middleware `useEnvelopeEncryption()`.
*   **Crypto-Shredding:** `deleteKey(id)` permanently erases data even in immutable logs.

---

## 5. Testing & Mocking Strategy

To ensure long-term maintainability across multiple projects, the Core exports a **Test Kit**.

### 5.1. The Memory Repository
`createMemoryRepository(plugins)` allows testing complex pipelines without a running Deno KV instance. It simulates:
*   Atomic Transactions
*   Key Expiration (TTL)
*   Queue Processing (Synchronous flush for testing)

### 5.2. Property-Based Testing
The spec mandates fuzz testing for plugins:
*   "Given random JSON input, `save` -> `find` must always return deep-equal output."
*   "Given a tampered hash in storage, `find` must always throw IntegrityError."

---

## 6. Migration & Roadmap

1.  **Phase 1: Core Engine:** Implement `createRepository` and the basic `useSchema` plugin.
2.  **Phase 2: "Redis" Replacement:** Implement `useCache` (TTL) and deploy "Ephemeral Mode" for Rate Limiting.
3.  **Phase 3: The Trust Layer:** Implement `useVersionedChain` and `useMerkleTree`.
4.  **Phase 4: Analytics:** Implement `useMaterializedView` with Queue workers.
