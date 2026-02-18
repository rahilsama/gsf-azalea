import { Router } from 'express';
import { registerHandler, loginHandler } from './auth.controller';
import { validateBody } from '../../middleware/validate';
import { registerSchema, loginSchema } from './auth.schemas';
import { authenticate, authorize } from '../../middleware/auth';
import { Role } from '@prisma/client';

export const authRouter = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user (admin only)
 *     tags:
 *       - Auth
 */
authRouter.post('/register', authenticate, authorize(Role.ADMIN), validateBody(registerSchema), registerHandler);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login and receive JWT
 *     tags:
 *       - Auth
 */
authRouter.post('/login', validateBody(loginSchema), loginHandler);

