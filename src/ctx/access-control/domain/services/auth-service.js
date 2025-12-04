export const createAuthService = (security) => {
    return {
        hashPassword: (password) => security.passwordHasher.hash(password),
        verifyPassword: (password, hash) => security.passwordHasher.compare(password, hash),
        generateToken: (payload) => security.jwtProvider.sign(payload)
    };
};
