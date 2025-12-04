export const createPricingService = () => {
    const calculatePrice = (product, quantity = 1, customerGroup = null) => {
        let finalPrice = product.price;
        let appliedRule = null;

        if (!product.priceRules || product.priceRules.length === 0) {
            return { price: finalPrice, appliedRule: null };
        }

        // Sort rules by priority (higher first)
        const sortedRules = [...product.priceRules].sort((a, b) => b.priority - a.priority);

        for (const rule of sortedRules) {
            if (!rule.conditions) continue;

            // Check Date Validity
            const now = new Date();
            if (rule.conditions.startDate && new Date(rule.conditions.startDate) > now) continue;
            if (rule.conditions.endDate && new Date(rule.conditions.endDate) < now) continue;

            // Check Min Quantity
            if (rule.conditions.minQuantity && quantity < rule.conditions.minQuantity) continue;

            // Check Customer Group
            if (rule.conditions.customerGroup && rule.conditions.customerGroup !== customerGroup) continue;

            // Apply Rule
            if (rule.actions.type === 'FIXED_PRICE') {
                finalPrice = rule.actions.value;
            } else if (rule.actions.type === 'FIXED_AMOUNT_OFF') {
                finalPrice = Math.max(0, finalPrice - rule.actions.value);
            } else if (rule.actions.type === 'PERCENTAGE_OFF') {
                finalPrice = finalPrice * (1 - rule.actions.value / 100);
            }

            appliedRule = rule;
            break; // Stop at first matching rule (highest priority)
        }

        return { price: finalPrice, appliedRule };
    };

    return { calculatePrice };
};
