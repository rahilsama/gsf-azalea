import type { NextFunction, Request, Response } from 'express';
import type { AnyZodObject, ZodEffects } from 'zod';

type Schema = AnyZodObject | ZodEffects<AnyZodObject>;

export const validateBody =
  (schema: Schema) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.body);
      req.body = parsed;
      return next();
    } catch (err: any) {
      return res.status(400).json({
        message: 'Validation error',
        errors: err.errors ?? err,
      });
    }
  };

