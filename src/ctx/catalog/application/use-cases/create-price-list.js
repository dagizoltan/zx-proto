import { z } from 'zod';
import { Ok, Err } from '../../../../../lib/trust/index.js';

export const createCreatePriceList = ({ priceListRepository }) => {
  const schema = z.object({
    name: z.string().min(1),
    currency: z.string().default('USD'),
    description: z.string().optional(),
    prices: z.array(z.object({
        productId: z.string().uuid(),
        price: z.number().nonnegative()
    })).default([]) // Schema changed to array for validation, or we map
  });

  const execute = async (tenantId, data) => {
    // Adapter logic: if input is record, convert to array for internal storage/schema?
    // Or just trust Zod.
    // The spec/schema I defined uses array for prices.

    // Check if input uses old record format
    let input = { ...data };
    if (data.prices && !Array.isArray(data.prices) && typeof data.prices === 'object') {
        input.prices = Object.entries(data.prices).map(([k, v]) => ({ productId: k, price: v }));
    }

    const parseResult = schema.safeParse(input);
    if (!parseResult.success) {
        return Err({ code: 'VALIDATION_ERROR', issues: parseResult.error.issues });
    }
    const validated = parseResult.data;

    const priceList = {
      id: crypto.randomUUID(),
      tenantId,
      ...validated,
      createdAt: new Date().toISOString()
    };

    return priceListRepository.save(tenantId, priceList);
  };

  return { execute };
};
