import { z } from 'zod';

export const PriceListSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    currency: z.string().default('USD'),
    prices: z.array(z.object({
        productId: z.string().uuid(),
        price: z.number().nonnegative()
    })).default([])
});
