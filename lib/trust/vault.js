import { Ok, Err } from './result.js';

const ALGO = { name: 'AES-GCM', length: 256 };

// Helper: Text <-> ArrayBuffer
const enc = new TextEncoder();
const dec = new TextDecoder();

const importMasterKey = async (keyString) => {
  // Hash the simple string password to get a 32-byte key
  const keyMaterial = enc.encode(keyString);
  const keyHash = await crypto.subtle.digest('SHA-256', keyMaterial);
  return crypto.subtle.importKey('raw', keyHash, ALGO, false, ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']);
};

const generateKey = async () => {
  return crypto.subtle.generateKey(ALGO, true, ['encrypt', 'decrypt']);
};

const encryptKey = async (keyToWrap, wrappingKey) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const rawKey = await crypto.subtle.exportKey('raw', keyToWrap);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, wrappingKey, rawKey);

  // Return format: IV + Ciphertext (concatenated)
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return combined;
};

const decryptKey = async (wrappedData, wrappingKey) => {
  const iv = wrappedData.slice(0, 12);
  const data = wrappedData.slice(12);

  const rawKey = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, wrappingKey, data);
  return crypto.subtle.importKey('raw', rawKey, ALGO, true, ['encrypt', 'decrypt']);
};

export const createNativeKeyVault = (kv, masterKeyString) => {
  let masterKeyPromise = null;

  const getMasterKey = () => {
    if (!masterKeyPromise) {
      masterKeyPromise = importMasterKey(masterKeyString);
    }
    return masterKeyPromise;
  };

  const getTenantKey = async (tenantId) => {
    try {
      const mk = await getMasterKey();
      const vaultKey = ['sys', 'vault', tenantId];
      const res = await kv.get(vaultKey);

      if (!res.value) {
        // First time: Generate new TEK, wrap with MK, save to Vault
        const tek = await generateKey();
        const wrappedTek = await encryptKey(tek, mk);

        // Atomic check to prevent race conditions on key generation
        const atomic = kv.atomic();
        atomic.check({ key: vaultKey, versionstamp: null });
        atomic.set(vaultKey, wrappedTek);
        const commit = await atomic.commit();

        if (!commit.ok) {
           // Retry recursion if race condition (another process made the key)
           return getTenantKey(tenantId);
        }
        return Ok(tek);
      }

      // Existing key: Unwrap with MK
      const tek = await decryptKey(res.value, mk);
      return Ok(tek);

    } catch (e) {
      return Err({ code: 'VAULT_ERROR', message: e.message, tenantId });
    }
  };

  return {
    getTenantKey
  };
};
