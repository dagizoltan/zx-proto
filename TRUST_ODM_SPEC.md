# Trust ODM: Technical Specification (v1.3)

**Date:** October 26, 2024
**Status:** DRAFT / RFC
**Context:** IMS Shopfront "High-Trust Provenance Platform"
**Style:** Functional Programming (No Classes/OOP)
**Target Runtime:** Deno Deploy (Edge-Native)

---

## 1. Overview
The **Trust ODM (Object Document Mapper)** is a custom persistence layer built on top of Deno KV. It bridges the gap between a standard Key-Value store and an Enterprise-Grade Compliance Platform.

**Core Capabilities:**
1.  **Strict Schemas:** Type validation and structure enforcement via Zod-like functional schemas.
2.  **Compliance by Default:** Native field-level encryption (HIPAA) and Data Residency tagging (GDPR).
3.  **Trust Tiering:** Configurable data storage modes (`Standard`, `Chain`, `Web3`).
4.  **Advanced Indexing:** Support for **Nested Fields** (`address.city`).
5.  **Real-Time Aggregations:** **Materialized Views** backed by Deno KV Queues.
6.  **Schema Evolution:** Zero-downtime lazy migrations.
7.  **Native Observability:** Built-in integration with the platform's `obs` layer.

---

## 2. Competitive Analysis: Edge Native vs. Legacy DBs

| Feature | MySQL / Postgres | MongoDB | Trust ODM (Deno KV) |
| :--- | :--- | :--- | :--- |
| **Hosting** | Centralized (Latency penalty) | Centralized | **Edge Distributed** (Global Low Latency) |
| **Joins** | Native (SQL JOIN) | `$lookup` (Expensive) | **Application-Side** (`populate`) |
| **Aggregations** | `GROUP BY` (Slow on large data) | Aggregation Pipeline | **Materialized Views** (O(1) Reads) |
| **Consistency** | Strong (ACID) | Eventual / Strong | **Strong** (Atomic Transactions) |
| **Compliance** | Add-on / Proxy | Encryption at Rest | **Native Field-Level Encryption** |
| **Cost** | High (Instance hours) | High (Atlas Cluster) | **Usage Based** (Scale to Zero) |

**Verdict:** For a global, high-trust supply chain platform, Trust ODM offers superior read performance and compliance features at the cost of write complexity (which the ODM abstracts away).

---

## 3. Advanced Indexing (Nested Objects)

To compete with Mongo's document indexing, the ODM supports Dot-Notation for nested fields.

```javascript
// Schema Definition
const UserSchema = defineSchema({
  fields: {
    profile: {
      type: Types.Object,
      schema: {
        address: {
          city: { type: Types.String }
        }
      }
    }
  },
  indexes: [
    { fields: ['profile.address.city'] } // Nested Index
  ]
});
```

**Implementation:**
The `save` pipeline flattens the object to extract values.
*   **Object:** `{ profile: { address: { city: 'Berlin' } } }`
*   **Index Key:** `['idx', 'user', 'profile.address.city', 'Berlin', id]`

---

## 4. Materialized Views (Aggregations)

Since Deno KV cannot perform "Scan & Sum" efficiently, we use **Background Aggregation** via Deno KV Queues. This provides Real-Time Dashboards with O(1) read cost.

```javascript
import { defineView } from '@ims/trust-odm';

// Define a View: "Total Sales Per Day"
export const DailySalesView = defineView({
  name: 'daily_sales',
  source: 'order', // Listen to Order changes

  // The 'Map' step (runs on every Save/Delete)
  map: (order) => ({
    key: order.date.slice(0, 10), // Group by YYYY-MM-DD
    value: order.total
  }),

  // The 'Reduce' step (Atomic Increment)
  reduce: 'SUM' // or 'COUNT', 'AVG'
});
```

### 4.1. Implementation (Queue Processor)

1.  **Write Path:** When `OrderRepository.save()` completes, it pushes a message to `kv.enqueue({ type: 'view_update', view: 'daily_sales', delta: +100 })`.
2.  **Worker Path:** The Deno Queue consumer picks up the message and performs an atomic update on the View Key: `['views', 'daily_sales', '2024-10-26']`.
3.  **Read Path:** `DailySalesView.get('2024-10-26')` returns the pre-calculated sum instantly.

---

## 5. Trust Tiers (Storage Modes)

### 5.1. `Standard` (Mutable)
*   **Behavior:** Standard transactional storage.
*   **Use Case:** User preferences, UI state, Draft Carts.

### 5.2. `Chain` (Internal Immutable Ledger)
*   **Behavior:** **Append-Only Versioning.** Updates create `v2` with `prevHash` of `v1`.
*   **Use Case:** Audit Trails, Inventory History.

### 5.3. `Web3` (Public Merkle Proof)
*   **Behavior:** **Global Merkle Anchoring.** Hashes are added to a Deno KV Merkle Tree.
*   **Use Case:** Provenance Certificates.

---

## 6. Architecture & Implementation Plan

### 6.1. The Repository Factory

```javascript
export const createTrustRepository = (kv, schema, config, obs) => {

  const validate = createValidator(schema);
  const migrate = createMigrator(schema);
  const encrypt = createEnvelopeEncryptor(config);
  const hash = createHasher(schema);
  const indexer = createIndexer(schema); // Handles Nested logic

  const save = async (tenantId, data) => {
    return obs.traceSpan(`odm.save.${schema.name}`, async () => {
        // ... Validation, Encryption, Hashing ...

        const atom = kv.atomic();
        // ... Set Data ...

        // Indexing (Nested Support)
        indexer.apply(atom, validData);

        // View Triggers (Enqueue Side-Effects)
        if (schema.views) {
            schema.views.forEach(view => {
                 const msg = { type: 'VIEW_UPDATE', view: view.name, data: validData };
                 atom.enqueue(msg); // Atomic Enqueue
            });
        }

        await atom.commit();
        return validData;
    });
  };
  // ... find() ...
  return { save, find };
};
```

### 6.2. Compliance (HIPAA / GDPR)
*   **Envelope Encryption:** DEK encrypted by KEK for key rotation.
*   **Crypto-Shredding:** Delete KEK to "erase" data.

---

## 7. Migration Strategy

1.  **Phase 1: Standard ODM:** Refactor entities.
2.  **Phase 2: Views:** Define `DailySalesView` and `InventoryCountView` to replace expensive dashboard queries.
3.  **Phase 3: Chain/Web3:** Enable Trust features.
