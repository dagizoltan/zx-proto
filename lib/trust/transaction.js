import { Ok, Err, isErr } from './result.js';

export const runTransaction = async (kvPool, fn, { retries = 5, delay = 50 } = {}) => {
    let attempt = 0;
    while (attempt < retries) {
        attempt++;
        const result = await kvPool.withConnection(async (kv) => {
            const atomic = kv.atomic();
            // User function executes logic and adds ops to atomic
            // It should return { ok: true/false, ... } or just be void?
            // To be safe, we expect the user fn to return a Result.
            // If Ok, we commit.

            const res = await fn(atomic, kv); // Pass kv in case they need to read inside transaction
            if (isErr(res)) return res;

            try {
                const commitRes = await atomic.commit();
                if (commitRes.ok) {
                    return Ok(res.value); // Return the value from the inner function
                } else {
                     return Err({ code: 'CONFLICT', message: 'Concurrency conflict during commit' });
                }
            } catch (e) {
                 if (e.message && (e.message.includes('database is locked') || e.name === 'TypeError')) {
                     return Err({ code: 'LOCKED', message: e.message });
                 }
                 return Err({ code: 'COMMIT_ERROR', message: e.message });
            }
        });

        if (isErr(result)) {
            const code = result.error.code;
            if (code === 'CONFLICT' || code === 'LOCKED' || code === 'TIMEOUT') {
                const wait = Math.random() * delay * attempt;
                await new Promise(r => setTimeout(r, wait));
                continue;
            }
            return result;
        }
        return result;
    }
    return Err({ code: 'TIMEOUT', message: 'Transaction failed after retries' });
};
