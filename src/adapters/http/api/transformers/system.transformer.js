/**
 * System Transformers
 */

export const toApiUser = (user) => {
    // Ensure sensitive data is not returned
    const { passwordHash, ...safeUser } = user;
    return safeUser;
};

export const toApiUserList = (result) => {
    return {
        items: result.items.map(toApiUser),
        nextCursor: result.nextCursor,
        total: result.total
    };
};

export const toApiRole = (role) => {
    return {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
    };
};
