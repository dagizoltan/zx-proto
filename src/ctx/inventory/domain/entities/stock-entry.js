import { Ok, Err } from '../../../../../lib/trust/index.js';
import { ErrorCodes } from '../../../../utils/error-codes.js';

export const createStockEntry = ({
  id,
  tenantId,
  productId,
  locationId,
  quantity,
  reservedQuantity = 0,
  batchId,
  version = 0
}) => ({
  id,
  tenantId,
  productId,
  locationId,
  quantity,
  reservedQuantity,
  batchId,
  version,
  updatedAt: new Date().toISOString(),
});

export const availableStock = (entry) => entry.quantity - entry.reservedQuantity;

/**
 * Attempts to allocate stock from this entry.
 * Domain Logic: Enforces that we cannot reserve more than what is available.
 *
 * @param {Object} entry - The stock entry immutable state
 * @param {number} amount - The amount to allocate
 * @returns {Result<{ entry: Object, taken: number }, Error>}
 */
export const allocateStock = (entry, amount) => {
    const available = availableStock(entry);

    if (available <= 0) {
        return Ok({ entry, taken: 0 }); // Nothing to take
    }

    const take = Math.min(available, amount);

    const newEntry = {
        ...entry,
        reservedQuantity: entry.reservedQuantity + take,
        version: (entry.version || 0) + 1,
        updatedAt: new Date().toISOString()
    };

    return Ok({ entry: newEntry, taken: take });
};

/**
 * Attempts to release reserved stock from this entry.
 *
 * @param {Object} entry
 * @param {number} amount
 */
export const releaseStock = (entry, amount) => {
    // Safety check, though logically shouldn't happen if workflows are correct
    const safeRelease = Math.min(entry.reservedQuantity, amount);

    const newEntry = {
        ...entry,
        reservedQuantity: entry.reservedQuantity - safeRelease,
        version: (entry.version || 0) + 1,
        updatedAt: new Date().toISOString()
    };

    return Ok({ entry: newEntry, released: safeRelease });
};

/**
 * Consumes stock (reduces quantity and reserved quantity).
 * Typically happens after shipment (commit).
 */
export const consumeStock = (entry, amount) => {
    // We assume the amount was already reserved.
    // If not, this logic might need to check standard quantity too.
    // For "Commit", we reduce both.

    const newEntry = {
        ...entry,
        quantity: entry.quantity - amount,
        reservedQuantity: entry.reservedQuantity - amount,
        version: (entry.version || 0) + 1,
        updatedAt: new Date().toISOString()
    };

    if (newEntry.quantity < 0 || newEntry.reservedQuantity < 0) {
        return Err({ code: ErrorCodes.INVARIANT_VIOLATION, message: 'Stock cannot be negative' });
    }

    return Ok(newEntry);
};
