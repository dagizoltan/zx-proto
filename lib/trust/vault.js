import { Result, Errors } from './types.js';
import { CryptoUtils } from './utils/crypto.js';

/**
 * Native Key Vault Factory
 * Handles Tenant Encryption Keys (TEK) and Data Encryption Keys (DEK)
 * using an injected Master Key.
 *
 * @param {Deno.Kv} kv - The Deno KV instance
 * @param {string} masterKeyBase64 - The Master Key (from env)
 */
export const createKeyVault = (kv, masterKeyBase64) => {
  if (!masterKeyBase64) {
    console.warn('⚠️  KeyVault: No Master Key provided. Running in INSECURE mode (Dev).');
  }

  // Cache the unwrapped master key
  let _masterKey = null;
  const getMasterKey = async () => {
    if (_masterKey) return _masterKey;

    if (!masterKeyBase64) {
       // DEV MODE: Generate a random master key in memory so encryption still works
       _masterKey = await CryptoUtils.generateKey();
       return _masterKey;
    }

    _masterKey = await CryptoUtils.importKey(masterKeyBase64);
    return _masterKey;
  };

  /**
   * Get or Create Tenant Encryption Key (TEK)
   * The TEK is stored in KV, encrypted by the Master Key.
   */
  const getTenantKey = async (tenantId) => {
    const mk = await getMasterKey();
    // mk is now GUARANTEED to be a CryptoKey (either imported or generated)

    const vaultKey = ['sys', 'vault', tenantId];
    const existing = await kv.get(vaultKey);

    if (existing.value) {
      // Unwrap existing TEK
      const decrypted = await CryptoUtils.decrypt(mk, existing.value);
      if (!decrypted.ok) return Result.fail(Errors.Encryption(`Failed to unlock vault for ${tenantId}`));

      const rawTek = decrypted.value; // This is the exported string (base64)
      return Result.ok(await CryptoUtils.importKey(rawTek));
    } else {
      // Generate New TEK
      const newTek = await CryptoUtils.generateKey();
      const rawTek = await CryptoUtils.exportKey(newTek);

      // Wrap with Master Key
      const wrapped = await CryptoUtils.encrypt(mk, rawTek);
      if (!wrapped.ok) return wrapped;

      // Persist
      await kv.set(vaultKey, wrapped.value);
      return Result.ok(newTek);
    }
  };

  /**
   * Generate a fresh Data Encryption Key (DEK)
   * Returns: { key: CryptoKey, wrapped: { iv, ciphertext } }
   * The 'wrapped' part is stored with the record.
   */
  const generateDataKey = async (tenantId) => {
    const tekResult = await getTenantKey(tenantId);
    if (!tekResult.ok) return tekResult;
    const tek = tekResult.value;

    // Generate DEK
    const dek = await CryptoUtils.generateKey();
    const rawDek = await CryptoUtils.exportKey(dek);

    // Encrypt DEK with TEK (Envelope)
    const wrapped = await CryptoUtils.encrypt(tek, rawDek);
    if (!wrapped.ok) return wrapped;

    return Result.ok({
        key: dek,
        wrapped: wrapped.value
    });
  };

  /**
   * Unwrap a stored Data Key
   */
  const unwrapDataKey = async (tenantId, wrappedDek) => {
      const tekResult = await getTenantKey(tenantId);
      if (!tekResult.ok) return tekResult;
      const tek = tekResult.value;

      const decrypted = await CryptoUtils.decrypt(tek, wrappedDek);
      if (!decrypted.ok) return decrypted;

      // Import back to CryptoKey
      return Result.ok(await CryptoUtils.importKey(decrypted.value));
  };

  return {
    getTenantKey,
    generateDataKey,
    unwrapDataKey
  };
};
