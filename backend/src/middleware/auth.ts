import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.substring('Bearer '.length);
  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthUser & { iat: number; exp: number };
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const authorize =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    return next();
  };

