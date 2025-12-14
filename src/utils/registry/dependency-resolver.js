export const resolveDependencies = (deps, schema) => {
  const resolved = {};

  // Helper to access nested properties safely (e.g., 'infra.persistence')
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  for (const [key, path] of Object.entries(schema)) {
    if (Array.isArray(path)) {
      // Try multiple paths (e.g., ['kvPool', 'persistence.kvPool'])
      // Returns the first one that is strictly not undefined/null
      resolved[key] = path.reduce((val, p) =>
        val !== undefined && val !== null ? val : getNestedValue(deps, p),
        undefined
      );
    } else {
      resolved[key] = getNestedValue(deps, path);
    }
  }

  return resolved;
};
