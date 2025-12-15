import { Ok, Err, isErr } from './result.js';
import { ErrorCodes } from '../../src/utils/error-codes.js';

/**
 * Runs operations in a Deno KV atomic transaction
 *
 * @param {Object} kvPool - The connection pool
 * @param {Function} fn - The transaction logic. Receives (atomic, kv). Must return Result.
 * @param {Object} options - Retry options
 * @returns {Promise<Result>}
 * @throws {Error} If any operation fails, all changes are rolled back automatically by Deno KV atomic commit failure.
 */
export const runTransaction = async (kvPool, fn, { retries = 5, delay = 50 } = {}) => {
    let attempt = 0;
    while (attempt < retries) {
        attempt++;
        const result = await kvPool.withConnection(async (kv) => {
            const atomic = kv.atomic();

            // Execute business logic
            // If this throws or returns Err, nothing is committed.
            const res = await fn(atomic, kv);

            if (isErr(res)) {
                return res; // Rollback (nothing committed yet)
            }

            try {
                const commitRes = await atomic.commit();

                if (commitRes.ok) {
                    return Ok(res.value); // Success
                } else {
                     // Optimistic concurrency failure
                     return Err({ code: ErrorCodes.CONFLICT, message: 'Concurrency conflict during commit' });
                }
            } catch (e) {
                 if (e.message && (e.message.includes('database is locked') || e.name === 'TypeError')) {
                     return Err({ code: ErrorCodes.LOCKED, message: e.message });
                 }
                 return Err({ code: ErrorCodes.COMMIT_ERROR, message: e.message });
            }
        });

        if (isErr(result)) {
            const code = result.error.code;
            if (code === ErrorCodes.CONFLICT || code === ErrorCodes.LOCKED || code === ErrorCodes.TIMEOUT) {
                const wait = Math.random() * delay * attempt;
                await new Promise(r => setTimeout(r, wait));
                continue;
            }
            return result;
        }
        return result;
    }
    return Err({ code: ErrorCodes.TIMEOUT, message: 'Transaction failed after retries' });
};
