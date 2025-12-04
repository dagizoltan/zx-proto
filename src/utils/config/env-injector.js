export const injectEnvSecrets = (config, envVars = Deno.env.toObject()) => {
  const inject = (obj) => {
    if (typeof obj === 'string') {
      // Replace ${ENV_VAR} or ${ENV_VAR:default} patterns
      return obj.replace(/\$\{([^:}]+)(?::([^}]+))?\}/g, (match, key, defaultValue) => {
        return envVars[key] ?? defaultValue ?? match;
      });
    }

    if (Array.isArray(obj)) {
      return obj.map(inject);
    }

    if (obj !== null && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, inject(value)])
      );
    }

    return obj;
  };

  return inject(config);
};
