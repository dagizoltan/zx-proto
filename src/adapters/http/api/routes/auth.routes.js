import { Hono } from 'hono';
import { validateRequest } from '../middleware/validation-middleware.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';
import { loginHandler, registerHandler } from '../handlers/auth/index.js';

export const authRoutes = new Hono();

authRoutes.post(
  '/login',
  validateRequest(loginSchema),
  loginHandler
);

authRoutes.post(
  '/register',
  validateRequest(registerSchema),
  registerHandler
);
