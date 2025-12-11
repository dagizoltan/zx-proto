import { Result, Errors } from '../types.js';
import { CryptoUtils } from '../utils/crypto.js';

/**
 * Immutable Chain Middleware
 * Links the current record to the previous version via Hash.
 */
export const useVersionedChain = () => (next) => async (ctx, data) => {
  if (ctx.operation === 'save') {
    // 1. Fetch previous version (Optimistic Lock)
    // FIX: Use consistent Multi-Tenant Key Structure
    const key = ['tenants', ctx.tenantId, 'data', ctx.schema?.name, data.id];
    const prevEntry = await ctx.kv.get(key);

    let prevHash = '0000000000000000000000000000000000000000000000000000000000000000'; // Genesis
    let version = 1;

    if (prevEntry.value) {
      prevHash = prevEntry.value.hash || prevHash;
      version = (prevEntry.value._v || 0) + 1;
    }

    // 2. Prepare payload for hashing (exclude volatile fields if any)
    const payload = { ...data, prevHash, _v: version };

    // 3. Calculate Hash
    const hashResult = await CryptoUtils.hash(payload);
    if (!hashResult.ok) return hashResult;

    const finalData = { ...payload, hash: hashResult.value };

    // 4. Save
    return next(ctx, finalData);
  }

  // On Find: Verify Integrity?
  // Doing it on every read is expensive. We can add a verify() method later.
  return next(ctx, data);
};
