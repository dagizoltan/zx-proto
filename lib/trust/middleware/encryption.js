import { Result, Errors } from '../types.js';
import { CryptoUtils } from '../utils/crypto.js';

/**
 * Envelope Encryption Middleware
 * Encrypts fields marked 'encrypted: true' using the Vault.
 */
export const useEncryption = (vault, schemaDef) => (next) => async (ctx, data) => {
  if (ctx.operation === 'save') {
    // 1. Check for encrypted fields
    const encryptedFields = Object.entries(schemaDef.fields || {})
      .filter(([_, conf]) => conf.encrypted)
      .map(([k]) => k);

    if (encryptedFields.length === 0) return next(ctx, data);

    // 2. Generate Data Key (DEK)
    const dekResult = await vault.generateDataKey(ctx.tenantId);
    if (!dekResult.ok) return dekResult;
    const { key, wrapped } = dekResult.value;

    // 3. Encrypt Fields
    const transformed = { ...data, _k: wrapped }; // Store wrapped key on doc

    for (const field of encryptedFields) {
      if (data[field]) {
        const encResult = await CryptoUtils.encrypt(key, data[field]);
        if (!encResult.ok) return encResult;
        transformed[field] = encResult.value; // Store { iv, ciphertext }
      }
    }

    return next(ctx, transformed);
  }

  if (ctx.operation === 'find') {
    const result = await next(ctx, data);
    if (!result.ok || !result.value) return result;

    const doc = result.value;
    if (!doc._k) return result; // Not encrypted

    // 1. Unwrap DEK
    const keyResult = await vault.unwrapDataKey(ctx.tenantId, doc._k);
    if (!keyResult.ok) return keyResult;
    const key = keyResult.value;

    // 2. Decrypt Fields
    const encryptedFields = Object.entries(schemaDef.fields || {})
      .filter(([_, conf]) => conf.encrypted)
      .map(([k]) => k);

    const decryptedDoc = { ...doc };
    delete decryptedDoc._k; // Remove key from output

    for (const field of encryptedFields) {
      if (doc[field]) {
        const decResult = await CryptoUtils.decrypt(key, doc[field]);
        if (!decResult.ok) {
             // If decryption fails, we return error or null?
             // Integrity failure.
             return Result.fail(Errors.Integrity(`Decryption failed for ${field}`));
        }
        decryptedDoc[field] = decResult.value;
      }
    }

    return Result.ok(decryptedDoc);
  }

  return next(ctx, data);
};
