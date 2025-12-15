import { createJwtTokenProvider } from './jwt-token-provider.js';
import { createPasswordHasher } from './password-hasher.js';
import { resolveDependencies } from '../../utils/registry/dependency-resolver.js';

export const createSecurityContext = async (deps) => {
  const { config } = resolveDependencies(deps, { config: 'config' });

  const jwtProvider = createJwtTokenProvider(config);
  const passwordHasher = createPasswordHasher(config);

  return {
    jwtProvider,
    passwordHasher
  };
};

export const SecurityContext = {
    name: 'infra.security',
    factory: createSecurityContext
};
