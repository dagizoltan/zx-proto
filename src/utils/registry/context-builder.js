export const createContextBuilder = (name) => {
  const context = {
    name,
    version: '1.0.0',
    repositories: {},
    services: {},
    useCases: {},
    lifecycle: {
      initialized: false,
      shutdownHandlers: []
    }
  };

  const builder = {
    withRepositories: (repos) => {
      context.repositories = { ...context.repositories, ...repos };
      return builder;
    },
    withServices: (services) => {
      context.services = { ...context.services, ...services };
      return builder;
    },
    withUseCases: (useCases) => {
      context.useCases = { ...context.useCases, ...useCases };
      return builder;
    },
    onShutdown: (handler) => {
      if (typeof handler === 'function') {
        context.lifecycle.shutdownHandlers.push(handler);
      }
      return builder;
    },
    // Add custom properties if needed (e.g. gateways for testing visibility)
    withProps: (props) => {
        Object.assign(context, props);
        return builder;
    },
    build: () => {
        // Create a normalized shutdown method that calls all handlers
        const buildResult = { ...context };
        buildResult.shutdown = async () => {
            for (const handler of context.lifecycle.shutdownHandlers) {
                try {
                    await handler();
                } catch (e) {
                    console.error(`Error during shutdown of context ${name}:`, e);
                }
            }
        };
        return Object.freeze(buildResult);
    }
  };

  return builder;
};
