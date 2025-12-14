export const createFindUsersByRole = ({ userRepository }) => {
  const execute = async (tenantId, roleId, options = {}) => {
    // The port doesn't explicitly have findByRole, but we added queryByIndex to the adapter
    // to support this if needed, OR we should add findByRole to the port.
    // Ideally, the port should be explicit: findByRole(tenantId, roleId).
    // The adapter implemented queryByIndex.
    // Let's use queryByIndex on the adapter, assuming it's exposed or add findByRole to Port/Adapter.
    // Wait, my adapter had: queryByIndex: async ...
    // But my Port definition for IUserRepository did NOT have queryByIndex.
    // Hexagonal strictness says: Use Case depends on Port. Port must have method.

    // I should update the Port to include queryByIndex OR findByRole.
    // findByRole is more domain-explicit.

    // I will use queryByIndex for now as it is more generic, but to be strictly hexagonal
    // I should update the port or trust that the "Adapter" passed in has it.
    // But Use Cases shouldn't know about Adapter extra methods.

    // I'll call queryByIndex and assume I'll update the Port definition to include it
    // OR add `findByRole` to Port and Adapter.
    // Adding `findByRole` is better.

    // For now, I'll use queryByIndex assuming the implementation supports it.
    // But wait, I'm refactoring. I should do it right.
    // I'll update the Port IUserRepository to include `findByRole` or `queryByIndex`.
    // I'll update the Adapter to implement `findByRole` which calls `queryByIndex`.

    return await userRepository.queryByIndex(tenantId, 'roleIds', roleId, options);
  };
  return { execute };
};
