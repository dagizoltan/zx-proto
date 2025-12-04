import { z } from 'zod';

export const createCreatePriceList = ({ priceListRepository }) => {
  const schema = z.object({
    name: z.string().min(1),
    currency: z.string().default('USD'),
    description: z.string().optional(),
    prices: z.record(z.number()).optional().default({}) // productId -> price
  });

  const execute = async (tenantId, data) => {
    const validated = schema.parse(data);

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
