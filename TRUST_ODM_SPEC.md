# Trust ODM: Technical Specification (v1.0)

**Date:** October 26, 2024
**Status:** DRAFT / RFC
**Context:** IMS Shopfront "High-Trust Provenance Platform"
**Style:** Functional Programming (No Classes/OOP)

---

## 1. Overview
The **Trust ODM (Object Document Mapper)** is a custom persistence layer built on top of Deno KV. It bridges the gap between a standard Key-Value store and an Enterprise-Grade Compliance Platform, strictly adhering to functional programming principles.

**Core Capabilities:**
1.  **Strict Schemas:** Type validation and structure enforcement via Zod-like functional schemas.
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

## 4. Functional Schema Definition

Schemas are defined as immutable objects passed to repository factories.

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

The architecture follows a "Pipeline" pattern. Data flows through a series of pure functions before persistence.

### 5.1. The Repository Factory
Instead of a class, we export a factory function `createTrustRepository`.

```javascript
/**
 * Creates a repository instance for a specific schema.
 * @param {Deno.Kv} kv - The Deno KV handle
 * @param {Schema} schema - The Schema definition
 * @param {Object} config - Encryption keys, etc.
 */
export const createTrustRepository = (kv, schema, config) => {

  // Internal pipeline functions
  const validate = createValidator(schema);
  const encrypt = createEncryptor(schema, config); // Returns (data) -> Promise<EncryptedData>
  const hash = createHasher(schema);               // Returns (data) -> { ...data, hash, prevHash }
  const anchor = createMerkleAnchor(kv);           // (Optional) Adds to tree

  const save = async (tenantId, data) => {
    // Pipeline: Input -> Validate -> Encrypt -> Hash -> Anchor? -> Persist

    // 1. Validation
    const validData = validate(data);

    // 2. Encryption (Pure transformation)
    const encryptedData = await encrypt(tenantId, validData);

    // 3. Chain/Hashing (Dependent on current DB state for prevHash)
    const { finalData, versionKey } = await hash(kv, tenantId, encryptedData);

    // 4. Persistence (Atomic Transaction)
    const primaryKey = ['data', schema.name, validData.id];

    const atom = kv.atomic()
        .check({ key: primaryKey, versionstamp: null }) // Optimistic Lock
        .set(primaryKey, finalData)
        .set(versionKey, finalData); // Historical Version

    // 5. Indexing (Side-effect: add index keys to atom)
    applyIndexes(schema, validData, atom);

    // 6. Web3 Anchor (Side-effect: add merkle node to atom or batch queue)
    if (schema.trustTier === 'Web3') {
        await anchor(atom, finalData.hash);
    }

    const result = await atom.commit();
    return result.ok ? validData : null;
  };

  const find = async (tenantId, query) => {
      // 1. Query Resolution (Index Lookup)
      const keys = await queryResolver(kv, schema, tenantId, query);

      // 2. Fetch
      const rawDocs = await kv.getMany(keys);

      // 3. Decrypt & Inflate
      return Promise.all(rawDocs.map(d => decrypt(tenantId, d.value)));
  };

  return { save, find };
};
```

### 5.2. Functional Components

*   **`createValidator(schema)`**: Returns a pure function `(data) => validData | throw Error`.
*   **`createEncryptor(schema, config)`**: Returns an async function `(tenantId, data) => encryptedData`. Uses pure input/output.
*   **`queryResolver(kv, schema, tenantId, query)`**: A pure logic function that determines *which* keys to fetch based on the query object (e.g., `{ status: 'ACTIVE' }` maps to `['idx', 'status', 'ACTIVE']`).

### 5.3. Secondary Indexing Strategy
Deno KV lacks native queries. The ODM manages indexes via atomic operations.

*   **Data Key:** `['data', entityId]` -> `{ ...data }`
*   **Index Key:** `['idx', schemaName, 'status', 'ACTIVE', entityId]` -> `true`

**Query Logic:**
`find(tenantId, { status: 'ACTIVE' })`
1.  **Index Scan:** Iterate keys `['idx', 'patient', 'status', 'ACTIVE']`.
2.  **Key Extraction:** Map results to `entityId`s.
3.  **Batch Fetch:** `kv.getMany(keys)`.
4.  **Decryption:** Transform ciphertext back to plaintext.

### 5.4. The Merkle Engine (Functional)
*   **Storage:** Nodes stored as `['merkle', 'node', hash]`.
*   **Operation:** `insertLeaf(root, newHash)` returns `newRoot`.
*   **State:** The current tree state is passed into the function, and the new state is returned (or committed atomically).

---

## 6. Migration Strategy

1.  **Phase 1: Standard ODM:** Refactor current `createProduct`, `createOrder` use cases to use `createTrustRepository`.
2.  **Phase 2: Indexing:** Replace manual `listBy...` implementations with the generic `find` using declared indexes.
3.  **Phase 3: Chain Activation:** Enable `Chain` mode for critical entities.
4.  **Phase 4: Encryption & Web3:** Enable HIPAA encryption and Public Merkle Anchoring for Enterprise tiers.
