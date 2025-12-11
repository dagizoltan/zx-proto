import { Ok, Err } from '../result.js';

const ALGO = { name: 'AES-GCM', length: 256 };

// Helper to encrypt a single field
const encryptData = async (data, key) => {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

    // Return: IV (12 bytes) + Ciphertext
    const combined = new Uint8Array(iv.length + cipher.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(cipher), iv.length);

    // Convert to Base64 for storage in JSON/KV
    return btoa(String.fromCharCode(...combined));
};

const decryptData = async (base64, key) => {
    const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const iv = binary.slice(0, 12);
    const cipher = binary.slice(12);

    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    return JSON.parse(new TextDecoder().decode(decrypted));
};

export const useEncryption = (vault, encryptedFields = []) => {
    return {
        name: 'encryption',
        beforeSave: async (ctx, data) => {
            if (!encryptedFields.length) return Ok(data);

            const keyResult = await vault.getTenantKey(ctx.tenantId);
            if (!keyResult.ok) return keyResult;
            const tek = keyResult.value;

            const nextData = { ...data };

            for (const field of encryptedFields) {
                if (nextData[field] !== undefined && nextData[field] !== null) {
                    try {
                        nextData[field] = await encryptData(nextData[field], tek);
                    } catch (e) {
                        return Err({ code: 'ENCRYPTION_ERROR', field, message: e.message });
                    }
                }
            }
            return Ok(nextData);
        },
        afterRead: async (ctx, data) => {
             if (!encryptedFields.length || !data) return Ok(data);

             const keyResult = await vault.getTenantKey(ctx.tenantId);
             if (!keyResult.ok) return keyResult; // Or should we return Partial data? No, strict.
             const tek = keyResult.value;

             const nextData = { ...data };

             for (const field of encryptedFields) {
                // Check if it looks like base64 string
                 if (nextData[field] && typeof nextData[field] === 'string') {
                     try {
                         nextData[field] = await decryptData(nextData[field], tek);
                     } catch (e) {
                         // If decryption fails, it might be unencrypted legacy data or corruption
                         console.error(`Decryption failed for ${field}:`, e);
                         nextData[field] = null; // Fail safe?
                     }
                 }
             }
             return Ok(nextData);
        }
    };
};
