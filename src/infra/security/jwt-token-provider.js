import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

export const createJwtTokenProvider = (config) => {
  const secret = config.get('security.jwt.secret') || 'default-secret';
  const keyPromise = crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );

  const sign = async (payload) => {
    const key = await keyPromise;
    const jwt = await create({ alg: "HS256", typ: "JWT" }, {
      ...payload,
      exp: getNumericDate(60 * 60 * 24 * 7) // 7 days default
    }, key);
    return jwt;
  };

  const verifyToken = async (token) => {
    try {
      const key = await keyPromise;
      const payload = await verify(token, key);
      return payload;
    } catch (e) {
      throw new Error(`Invalid token: ${e.message}`);
    }
  };

  return { sign, verify: verifyToken };
};
