import type { Request, Response, NextFunction } from 'express';
import { createUser, authenticateUser } from './auth.service';

export const registerHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await createUser(req.body);
    res.status(201).json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (err) {
    next(err);
  }
};

export const loginHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authenticateUser(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

