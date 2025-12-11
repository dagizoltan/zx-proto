# Trust ODM: Technical Specification (v1.2)

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
5.  **Schema Evolution:** Zero-downtime lazy migrations.
6.  **Native Observability:** Built-in integration with the platform's `obs` layer for integrity alerts and performance metrics.

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

### 3.1. Envelope Encryption (Key Rotation Support)
To support annual key rotation without re-encrypting massive datasets, we utilize **Envelope Encryption**:
1.  **DEK (Data Encryption Key):** A unique random key generated for *each record*. Encrypts the payload.
2.  **KEK (Key Encryption Key):** The Tenant's master key. Encrypts the DEK.
3.  **Storage:** The record stores the `EncryptedPayload` + `WrappedDEK`.
4.  **Rotation:** To rotate keys, we only need to decrypt and re-encrypt the `WrappedDEK`s, not the payloads.

### 3.2. Data Sovereignty & Deletion (GDPR)
*   **Right to be Forgotten:** The ODM supports "Crypto-Shredding".
    *   Deleting the *WrappedDEK* for a specific user/record renders the data permanently unreadable.

---

## 4. Functional Schema Definition

Schemas are defined as immutable objects passed to repository factories. They now include **Versioning** and **Relations**.

```javascript
import { defineSchema, Types } from '@ims/trust-odm';

export const PatientRecordSchema = defineSchema({
  name: 'patient_record',
  version: 2, // Current Schema Version
  trustTier: 'Chain',

  fields: {
    id: { type: Types.UUID, primary: true },
    tenantId: { type: Types.String, required: true },
    status: { type: Types.String, index: true },

    // Encrypted PHI
    fullName: { type: Types.String, encrypted: true, pii: true },

    // Relations (Foreign Keys)
    assignedDoctorId: { type: Types.UUID, ref: 'doctor' }
  },

  indexes: [
    { fields: ['tenantId', 'status'] }
  ],

  // Lazy Migrations (Applied on Read)
  migrations: {
    // v1 -> v2: Rename 'name' to 'fullName'
    2: (oldDoc) => ({ ...oldDoc, fullName: oldDoc.name, name: undefined })
  }
});
```

---

## 5. Architecture & Implementation Plan

The architecture follows a "Pipeline" pattern. Data flows through a series of pure functions.

### 5.1. The Repository Factory

The factory now accepts an `obs` adapter to emit high-fidelity telemetry.

```javascript
export const createTrustRepository = (kv, schema, config, obs) => {

  // Pipeline Composition
  const validate = createValidator(schema);
  const migrate = createMigrator(schema);         // (data) -> migratedData
  const encrypt = createEnvelopeEncryptor(config);// (data) -> { payload, wrappedKey }
  const hash = createHasher(schema);

  const save = async (tenantId, data) => {
    return obs.traceSpan(`odm.save.${schema.name}`, async () => {
        // 1. Validation
        const validData = validate(data);

        // 2. Envelope Encryption
        const { payload, wrappedKey } = await encrypt(tenantId, validData);

        // 3. Chain/Hashing
        const { finalData, versionKey } = await hash(kv, tenantId, { ...payload, _k: wrappedKey });

        // 4. Persistence (Atomic)
        const primaryKey = ['data', schema.name, validData.id];
        const atom = kv.atomic()
            .check({ key: primaryKey, versionstamp: null })
            .set(primaryKey, finalData)
            .set(versionKey, finalData);

        applyIndexes(schema, validData, atom);

        const result = await atom.commit();

        if (!result.ok) {
            obs.warn('odm.concurrency_conflict', { schema: schema.name, id: validData.id });
            throw new Error('Concurrency Conflict');
        }

        // 5. Audit Log (Side Effect)
        if (schema.trustTier !== 'Standard') {
            obs.audit(`Trust Record Created (${schema.trustTier})`, {
               schema: schema.name,
               id: validData.id,
               hash: finalData.hash,
               tenantId
            });
        }

        return validData;
    });
  };

  const find = async (tenantId, query, options = {}) => {
      return obs.traceSpan(`odm.find.${schema.name}`, async () => {
          const keys = await queryResolver(kv, schema, tenantId, query);
          const rawDocs = await kv.getMany(keys);

          const results = await Promise.all(rawDocs.map(async (d) => {
              if (!d.value) return null;

              // 1. Decrypt (Trace this heavy op)
              let doc = await obs.traceSpan('odm.decrypt', () => decrypt(tenantId, d.value));

              // 2. Integrity Check (Verify Hash Chain on Read)
              if (schema.trustTier === 'Chain' || schema.trustTier === 'Web3') {
                  const isValid = verifyIntegrity(doc);
                  if (!isValid) {
                      obs.error('trust.integrity_violation', {
                          schema: schema.name,
                          id: doc.id,
                          tenantId
                      });
                      throw new Error('Data Integrity Violation');
                  }
              }

              // 3. Lazy Migration (Schema Evolution)
              if (doc._v < schema.version) {
                 doc = migrate(doc);
                 obs.info('odm.migration_applied', { schema: schema.name, version: doc._v });
                 healBackground(tenantId, doc);
              }

              // 4. Populate Relations
              if (options.populate) {
                 doc = await populate(kv, schema, doc, options.populate);
              }

              return doc;
          }));

          return results.filter(Boolean);
      });
  };

  return { save, find };
};
```

### 5.2. Functional Utilities

*   **`createMigrator(schema)`**: Returns a function that checks `_v` (version) and runs the chain of migration functions `1->2`, `2->3` sequentially until up to date.
*   **`populate(kv, schema, doc, fields)`**: Pure utility. Looks up `ref` definitions in the schema. E.g., if `fields=['assignedDoctorId']`, it fetches the doctor record and merges it: `doc.assignedDoctor = { ... }`.
*   **`verifyIntegrity(doc)`**: Re-calculates the hash of the payload and confirms it matches the stored `hash`.

---

## 6. Migration Strategy to Trust ODM

1.  **Define Schemas:** Map all existing entities (Order, Product) to `defineSchema`.
2.  **Refactor Use Cases:** Update `src/ctx/*/use-cases/*.js` to use `createTrustRepository` instead of `createBaseRepository`.
3.  **Data Migration Script:** Write a one-time Deno script to iterate all existing KV entries and inject the `_v: 1` version tag and basic Schema metadata.
4.  **Key Rotation Policy:** Configure the initial `Standard` tier to use a placeholder KEK, then implement the real KMS integration for `Chain` tier.
