import type { Request, Response, NextFunction } from 'express';
import { importStudentsFromWorkbook } from './upload.service';

export const uploadStudentsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const result = await importStudentsFromWorkbook(req.file.buffer);
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

