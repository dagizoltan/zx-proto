# Trust Platform Core: Technical Specification (v2.2)

**Date:** October 26, 2024
**Status:** DRAFT / FINAL ARCHITECTURE
**Context:** General Purpose High-Trust Data Engine
**Target:** Multi-System Reusability (Replace Redis, Mongo, Blockchain Clients)

---

## 1. Executive Summary
The **Trust Platform Core** is a modular, functional data engine built on Deno KV. It is designed to be the foundational persistence layer for multiple future systems, ranging from simple caches to high-compliance RegTech platforms.

**Strategic Goals:**
1.  **Unified Stack:** Replace Redis (Cache), MongoDB (Document Store), and SQL (Relational) with a single, highly capable Deno KV abstraction.
2.  **Sovereign Infrastructure:** Zero reliance on external cloud providers for secrets (KMS) or auditing.
3.  **Plugin Architecture:** Core logic is minimal; capabilities (Encryption, Versioning, Auditing) are injected as middleware.

---

## 2. Architecture: The Functional Pipeline

The Core is built around **Composable Pipelines** and **Result Types**.

### 2.1. Functional Error Handling (Result Types)
To maintain functional purity and type safety, the Core **does not throw exceptions**. It returns a `Result` type.

```typescript
type Result<T, E> =
  | { ok: true, value: T }
  | { ok: false, error: E };

// Usage
const result = await repo.save(ctx, data);
if (!result.ok) {
  // Handle specific error types (Conflict, Validation, Integrity)
  return handleFailure(result.error);
}
```

### 2.2. The Composition Pattern

```javascript
import { createRepository, useSchema, useEncryption, useVersionedChain } from '@trust/core';

const PatientRepo = createRepository(kv, [
  // 1. Validation
  useSchema(PatientSchema),

  // 2. Sovereign Security (Native Key Vault)
  useEncryption(nativeKeyVault),

  // 3. Integrity (Blockchain)
  useVersionedChain({ tier: 'Chain' }),

  // 4. Observability
  useTelemetry({ span: 'patient.save' })
]);
```

---

## 3. Sovereign Infrastructure: Native Key Vault

We reject dependencies on AWS KMS or HashiCorp Vault. The platform implements its own **Native Key Vault** using Deno KV.

### 3.1. Architecture
*   **Master Key (MK):** The only secret injected via Environment Variable (`IMS_MASTER_KEY`).
*   **Key Vault (KV):** A dedicated Deno KV namespace `['sys', 'vault']`.
*   **Tenant Encryption Keys (TEK):** Stored in KV, encrypted by the MK (AES-GCM).
*   **Data Encryption Keys (DEK):** Generated per-record, encrypted by the TEK.

### 3.2. Implementation (`packages/key-vault`)

```javascript
export const createKeyVault = (kv, masterKey) => {
  return {
    // Returns the unwrapped TEK for a tenant
    getTenantKey: async (tenantId) => {
       const wrapped = await kv.get(['sys', 'vault', tenantId]);
       return aes.decrypt(wrapped, masterKey);
    },

    // Rotates the TEK (re-encrypts with same Master Key)
    rotateTenantKey: async (tenantId) => { ... }
  };
};
```

This ensures we own the cryptography stack entirely.

---

## 4. Deployment Modes (The "Redis Killer")

| Mode | Backend | Use Case | Replaces |
| :--- | :--- | :--- | :--- |
| **Ephemeral** | `:memory:` | Rate Limiting, Session Store, Job Queues | **Redis / Memcached** |
| **Edge** | `Deno Deploy` | Global SaaS, Multi-Tenant Platform | **DynamoDB / CosmosDB** |
| **Local** | `SQLite` | IoT Edge Devices, On-Premise Enterprise | **Embedded SQL** |

---

## 5. Feature Specifications

### 5.1. Advanced Indexing (Nested & Sparse)
*   **Nested:** Supports `fields: ['profile.address.city']` via key flattening.
*   **Sparse:** `filter: (doc) => doc.status === 'ACTIVE'` allows indexing only a subset.

### 5.2. Materialized Views (Async Aggregation)
*   **Mechanism:** Uses `Deno KV Queues` to decouple write-latency from analytics.
*   **Definition:** `defineView({ map: ..., reduce: ... })`.
*   **Result:** Real-time dashboards with O(1) read cost.

### 5.3. Compliance (HIPAA / GDPR / SOC2)

*   **SOC2 Common Criteria / Security:**
    *   **Encryption:** `useEncryption` ensures data is encrypted at rest using Envelope Encryption (CC6.1).
    *   **Native Vault:** Key management is internal and auditable, removing 3rd party trust (CC6.1).
*   **SOC2 Processing Integrity:**
    *   **Immutable Ledger:** `useVersionedChain` ensures no record is modified without a cryptographic audit trail (CC7.1).
*   **SOC2 Availability:**
    *   **Edge Mode:** Deploying to Deno Deploy provides multi-region redundancy automatically (A1.2).

---

## 6. Testing & Mocking Strategy

### 6.1. The Memory Repository
`createMemoryRepository(plugins)` allows testing complex pipelines without a running Deno KV instance.

### 6.2. Property-Based Testing
The spec mandates fuzz testing for plugins:
*   "Given random JSON input, `save` -> `find` must always return deep-equal output."
*   "Given a tampered hash in storage, `find` must always return `{ ok: false, error: 'IntegrityViolation' }`."

---

## 7. Migration & Roadmap

1.  **Phase 1: Key Vault:** Implement `packages/key-vault` with robust AES-GCM logic.
2.  **Phase 2: Core Engine:** Implement `createRepository` with Result Types.
3.  **Phase 3: The Trust Layer:** Implement `useVersionedChain` and `useMerkleTree`.
4.  **Phase 4: Analytics:** Implement `useMaterializedView` with Queue workers.
