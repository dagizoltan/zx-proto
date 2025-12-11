# Trust ODM: Technical Specification (v1.0)

**Date:** October 26, 2024
**Status:** DRAFT / RFC
**Context:** IMS Shopfront "High-Trust Provenance Platform"

---

## 1. Overview
The **Trust ODM (Object Document Mapper)** is a custom persistence layer built on top of Deno KV. It bridges the gap between a standard Key-Value store and an Enterprise-Grade Compliance Platform.

**Core Capabilities:**
1.  **Strict Schemas:** Type validation and structure enforcement.
2.  **Compliance by Default:** Native field-level encryption (HIPAA) and Data Residency tagging (GDPR).
3.  **Trust Tiering:** Configurable data storage modes (`Standard`, `Chain`, `Web3`) enabling native cryptographic verification.
4.  **Advanced Indexing:** Automatic management of secondary indexes to support complex queries.

---

## 2. Trust Tiers (Storage Modes)

The ODM supports three distinct storage modes, configurable per-schema or per-entity.

### 2.1. `Standard` (Mutable)
*   **Behavior:** Standard transactional storage. Overwrites previous values.
*   **Use Case:** User preferences, UI state, Draft Carts, temporary caches.
*   **Performance:** High (O(1) write).
*   **Compliance:** Basic Logging.

### 2.2. `Chain` (Internal Immutable Ledger)
*   **Behavior:** **Append-Only Versioning.**
    *   Updates create a new version key: `['data', entityId, v2]`.
    *   The new record contains a `prevHash` = `SHA-256(v1)`.
    *   Creates a cryptographic chain of custody for the entity.
*   **Use Case:** Internal Audit Trails, Inventory History, Order Status, User Activity Logs.
*   **Guarantee:** Tamper-Evident. If `v1` is modified, `v2`'s hash link becomes invalid.

### 2.3. `Web3` (Public Merkle Proof)
*   **Behavior:** **Global Merkle Anchoring.**
    *   Extends `Chain` mode.
    *   On save, the record's hash is inserted into a **Global Merkle Tree** stored in Deno KV.
    *   The **Merkle Root** is publicly exposed/published.
*   **Use Case:** Final Shipments, Drug Provenance, Aerospace Parts, Compliance Certificates.
*   **Guarantee:** **Public Non-Repudiation.** Any external party can verify a record exists and hasn't changed by requesting a Merkle Proof.

---

## 3. Compliance & Security (HIPAA / GDPR / SOC2)

### 3.1. Field-Level Encryption (HIPAA)
*   Fields marked `encrypted: true` are encrypted **before** hitting Deno KV.
*   **Algorithm:** AES-256-GCM.
*   **Key Management:**
    *   **Master Key:** Stored in environment/vault.
    *   **Tenant Key:** Derived/Wrapped per tenant (Multi-tenant isolation).
    *   **Context:** Encryption AAD (Additional Authenticated Data) binds data to the `EntityID`, preventing "Copy-Paste" attacks (swapping encrypted data between records).

### 3.2. Data Sovereignty & Deletion (GDPR)
*   **Right to be Forgotten:** The ODM supports "Crypto-Shredding".
    *   Deleting the *Encryption Key* for a specific user/record renders the data permanently unreadable (even if the immutable bytes remain on the `Chain` or Backups).
    *   `Standard` data is physically deleted.

---

## 4. Schema Definition

Schemas are defined as JavaScript objects (or JSON) registered at startup.

```javascript
import { defineSchema, Types } from '@ims/trust-odm';

export const PatientRecordSchema = defineSchema({
  name: 'patient_record',
  version: '1.0.0',
  trustTier: 'Chain', // Default tier

  fields: {
    // Primary Key
    id: { type: Types.UUID, primary: true },
    tenantId: { type: Types.String, required: true },

    // Indexable Fields (Fast Lookup)
    status: {
      type: Types.String,
      index: true,
      enum: ['ADMITTED', 'DISCHARGED']
    },

    // PII / PHI (Encrypted)
    fullName: {
      type: Types.String,
      encrypted: true,
      pii: true // GDPR Tag
    },
    diagnosis: {
      type: Types.String,
      encrypted: true
    },

    // Web3 Anchoring (Specific Fields)
    dischargeCertificateHash: {
      type: Types.String,
      trustTier: 'Web3' // Elevate this specific field/update to Public Anchor
    }
  },

  indexes: [
    // Composite Index
    { fields: ['tenantId', 'status'] }
  ]
});
```

---

## 5. Architecture & Implementation Plan

### 5.1. The `TrustRepository`
A generic repository wrapper that intercepts `save()`, `find()`, and `delete()`.

```javascript
class TrustRepository<T> {
  async save(data: T): Promise<T> {
    // 1. Validate Schema
    // 2. Encrypt Fields (if HIPAA)
    // 3. Calculate Hash
    // 4. If Chain/Web3: Fetch Prev Version -> Link Hash
    // 5. If Web3: Insert Hash into Merkle Tree
    // 6. Manage Secondary Indexes (Atomic Trans)
    // 7. Commit to KV
  }
}
```

### 5.2. Secondary Indexing Strategy
Deno KV lacks native queries. The ODM manages indexes manually:

*   **Data Key:** `['data', entityId]` -> `{ ...data }`
*   **Index Key:** `['idx', schemaName, 'status', 'ACTIVE', entityId]` -> `true`

**Query Logic:**
`db.patients.find({ status: 'ACTIVE' })`
1.  Scan keys starting with `['idx', 'patient', 'status', 'ACTIVE']`.
2.  Extract `entityId`s.
3.  Batch fetch Data Keys (`kv.getMany`).
4.  Decrypt & Return.

### 5.3. The Merkle Engine
*   **Storage:** The tree is stored as nodes in KV: `['merkle', 'node', hash]`.
*   **Batching:** To maintain performance, Merkle updates can be batched (e.g., every minute) or executed inline for high-value transactions.

---

## 6. Migration Strategy

1.  **Phase 1: Standard ODM:** Refactor current entities (Product, Order) to use the Schema definition but keep storage as `Standard`.
2.  **Phase 2: Indexing:** Enable the Indexing Engine to replace manual `listBy...` repository methods.
3.  **Phase 3: Chain Activation:** Enable `Chain` mode for Orders and Inventory Movements.
4.  **Phase 4: Encryption & Web3:** Roll out HIPAA encryption and Public Merkle Anchoring for specific enterprise clients.
