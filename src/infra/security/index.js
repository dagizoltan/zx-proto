import { createJwtTokenProvider } from './jwt-token-provider.js';
import { createPasswordHasher } from './password-hasher.js';

export const createSecurityContext = async (deps) => {
  const { config } = deps;

  const jwtProvider = createJwtTokenProvider(config);
  const passwordHasher = createPasswordHasher(config);

  return {
    jwtProvider,
    passwordHasher
  };
};
