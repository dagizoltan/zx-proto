export const createContextRegistry = () => {
  const structure = {
    config: null,
    infra: {},
    domain: {},
  };

  const factories = new Map();
  const dependencies = new Map();
  const initOrder = [];
  let isInitialized = false;

  // New Generic Register Method
  const register = (contextDefinition) => {
      const { name, factory, dependencies: deps = [] } = contextDefinition;

      // Determine type based on name prefix or definition property
      // Convention: 'infra.xxx' or 'xxx' (defaults to domain if not specified?)
      // Current system distinguishes infra vs domain in structure object.

      let type = 'domain';
      let cleanName = name;

      if (name.startsWith('infra.')) {
          type = 'infra';
          cleanName = name.replace('infra.', '');
      }

      const fullName = `${type}.${cleanName}`;

      factories.set(fullName, factory);
      dependencies.set(fullName, deps);

      return registry;
  };

  // Legacy Support
  const registerInfra = (name, factory, deps = []) => {
    return register({ name: `infra.${name}`, factory, dependencies: deps });
  };

  const registerDomain = (name, factory, deps = []) => {
    return register({ name, factory, dependencies: deps });
  };

  // Get from structure
  const get = (path) => {
    const keys = path.split('.');
    let value = structure;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        // Return undefined instead of throwing to allow safer checks
        return undefined;
      }
    }

    return value;
  };

  // Check if path exists
  const has = (path) => {
      const val = get(path);
      return val !== undefined;
  };

  // Set value in structure
  const set = (path, value) => {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = structure;

    for (const key of keys) {
      if (!(key in target)) {
        target[key] = {};
      }
      target = target[key];
    }

    target[lastKey] = value;
  };

  // Initialize all contexts (resolves dependency graph)
  const initialize = async (config) => {
    if (isInitialized) {
      return;
    }

    // Set config first
    structure.config = config;

    // Build dependency graph
    const graph = buildDependencyGraph();

    // Topological sort to determine initialization order
    const sorted = topologicalSort(graph);

    // Initialize contexts in order
    for (const fullName of sorted) {
      await initializeContext(fullName);
    }

    isInitialized = true;
  };

  // Initialize a single context
  const initializeContext = async (fullName) => {
    if (has(fullName)) {
      return get(fullName);
    }

    const factory = factories.get(fullName);
    if (!factory) {
      throw new Error(`No factory registered for: ${fullName}`);
    }

    const deps = dependencies.get(fullName) || [];

    // Resolve dependencies first
    // We pass the ENTIRE registry structure to the factory via `deps` + `registry`
    // But traditionally we resolved specific dependencies.
    // The new factories expect `deps` to contain the resolved dependency objects.

    // We will provide a flattened map of requested dependencies AND the whole structure for advanced usage
    const resolvedDeps = {
        // Provide direct access to the full structure for cross-context lookups (like autoGateway)
        infra: structure.infra,
        domain: structure.domain,
        ...structure // Spread full structure (config, infra, domain)
    };

    // We also verify that declared dependencies are initialized
    for (const depName of deps) {
      if (!has(depName)) {
        await initializeContext(depName);
      }

      // Map dependency to its short name (e.g., 'infra.persistence' -> 'persistence')
      // This allows factories/resolver to use `deps.persistence`
      const shortName = depName.split('.').pop();
      resolvedDeps[shortName] = get(depName);
    }

    // Create context instance
    try {
        const contextInstance = await factory({
            ...resolvedDeps,
            config: structure.config,
            registry,
        });

        // Validate context
        if (!contextInstance) {
            throw new Error(`Factory for ${fullName} returned null or undefined`);
        }

        set(fullName, contextInstance);
        initOrder.push(fullName);

        return contextInstance;
    } catch (error) {
        console.error(`❌ Failed to initialize ${fullName}`);
        console.error(`   Dependencies: ${deps.join(', ')}`);
        console.error(`   Error: ${error.message}`);
        throw error;
    }
  };

  // Build dependency graph
  const buildDependencyGraph = () => {
    const graph = new Map();

    for (const [name, deps] of dependencies.entries()) {
      graph.set(name, deps);
    }

    return graph;
  };

  // Topological sort for initialization order
  const topologicalSort = (graph) => {
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (node) => {
      if (visited.has(node)) return;
      if (visiting.has(node)) {
        throw new Error(`Circular dependency detected: ${node}`);
      }

      visiting.add(node);

      const deps = graph.get(node) || [];
      for (const dep of deps) {
        visit(dep);
      }

      visiting.delete(node);
      visited.add(node);
      sorted.push(node);
    };

    for (const node of graph.keys()) {
      visit(node);
    }

    return sorted;
  };

  // Get initialization order
  const getInitOrder = () => {
    return [...initOrder];
  };

  // List all registered contexts
  const list = () => {
    return Array.from(factories.keys());
  };

  // Shutdown all contexts (for cleanup)
  const shutdown = async () => {
    // Shutdown in reverse order
    for (const fullName of [...initOrder].reverse()) {
      const context = get(fullName);
      if (context && typeof context.shutdown === 'function') {
        await context.shutdown();
      }
    }

    structure.infra = {};
    structure.domain = {};
    structure.config = null;
    isInitialized = false;
    initOrder.length = 0;
  };

  const registry = {
    register,
    registerInfra,
    registerDomain,
    get,
    has,
    initialize,
    getInitOrder,
    list,
    shutdown,
  };

  return registry;
};
