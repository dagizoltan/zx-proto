import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

export const createPasswordHasher = (config) => {
  const saltRounds = config.get('security.password.saltRounds') || 10;

  const hash = async (password) => {
    return await bcrypt.hash(password, saltRounds);
  };

  const compare = async (password, hash) => {
    return await bcrypt.compare(password, hash);
  };

  return { hash, compare };
};
