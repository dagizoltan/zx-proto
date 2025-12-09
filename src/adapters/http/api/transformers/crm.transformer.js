/**
 * CRM Transformers
 */

export const toApiCustomer = (customer) => {
    // Customer is essentially a user profile
    const { passwordHash, ...safeCustomer } = customer;
    return safeCustomer;
};

export const toApiCustomerProfile = (profile) => {
    // Profile might contain orders, etc.
    return profile;
};

export const toApiCustomerList = (result) => {
    return {
        items: result.items.map(toApiCustomer),
        nextCursor: result.nextCursor,
        total: result.total
    };
};
