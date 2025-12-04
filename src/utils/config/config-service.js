import { loadYaml } from './yaml-loader.js';
import { injectEnvSecrets } from './env-injector.js';

export const createConfigService = async (environment = 'local') => {
  const configDir = './config';

  // Load configs in order: prod -> dev -> local (each overwrites previous)
  const prodConfig = await loadYaml(`${configDir}/app.prod.yaml`) || {};
  const devConfig = await loadYaml(`${configDir}/app.dev.yaml`) || {};
  const localConfig = await loadYaml(`${configDir}/app.local.yaml`) || {};
  const testConfig = await loadYaml(`${configDir}/app.test.yaml`) || {};

  // Deep merge configs based on environment
  let mergedConfig = deepMerge(prodConfig, {});

  if (environment === 'development' || environment === 'local' || environment === 'test') {
    mergedConfig = deepMerge(mergedConfig, devConfig);
  }

  if (environment === 'local' || environment === 'test') {
    mergedConfig = deepMerge(mergedConfig, localConfig);
  }

  if (environment === 'test') {
    mergedConfig = deepMerge(mergedConfig, testConfig);
  }

  // Inject environment variables
  const finalConfig = injectEnvSecrets(mergedConfig);

  // Create config accessor
  const get = (path, defaultValue = undefined) => {
    const keys = path.split('.');
    let value = finalConfig;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }

    return value;
  };

  const getRequired = (path) => {
    const value = get(path);
    if (value === undefined) {
      throw new Error(`Required config key not found: ${path}`);
    }
    return value;
  };

  const has = (path) => {
    return get(path) !== undefined;
  };

  const getAll = () => {
    return { ...finalConfig };
  };

  return {
    get,
    getRequired,
    has,
    getAll,
    environment,
  };
};

// Deep merge helper
const deepMerge = (target, source) => {
  const result = { ...target };

  for (const key in source) {
    if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
};
