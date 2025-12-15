/**
 * Auto Gateway Proxy
 *
 * Automatically creates a proxy around a dependency context to expose its use cases
 * as direct method calls.
 *
 * @param {Object} deps - The dependencies object (flat or nested)
 * @param {String} contextName - The name of the context to proxy (e.g., 'catalog')
 * @returns {Proxy} A proxy object
 * @throws {Error} If context not found
 */
export const autoGateway = (deps, contextName) => {
  // Try to find the context in dependencies
  // 1. Direct match: deps.catalog
  // 2. Domain namespaced: deps['domain.catalog']
  const context = deps[contextName] || deps[`domain.${contextName}`];

  if (!context) {
    throw new Error(`Required context '${contextName}' not found in dependencies`);
  }

  // Return a Proxy that delegates to the context
  return new Proxy({}, {
    get: (target, prop) => {
      // 1. Check if it's a Use Case (common pattern: context.useCases.someAction)
      if (context.useCases && context.useCases[prop]) {
        const useCase = context.useCases[prop];
        // If the use case has an 'execute' method, bind and return it
        if (useCase && typeof useCase.execute === 'function') {
          return (...args) => useCase.execute(...args);
        }
        // If it's just a function, return it
        if (typeof useCase === 'function') {
           return (...args) => useCase(...args);
        }
        return useCase;
      }

      // 2. Check services
      if (context.services && context.services[prop]) {
          return context.services[prop];
      }

      // 3. Fallback: check direct properties on context (e.g. name, custom props)
      if (prop in context) {
        return context[prop];
      }

      // 4. Return undefined if not found (standard JS behavior)
      return undefined;
    }
  });
};

/**
 * Gateway Factory Helper
 *
 * @param {Object} deps
 * @returns {Object} Factory with .forContext(name) method
 */
export const createGatewayFactory = (deps) => ({
    forContext: (name) => autoGateway(deps, name)
});
