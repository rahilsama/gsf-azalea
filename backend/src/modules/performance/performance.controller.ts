import type { Request, Response, NextFunction } from 'express';
import { addPerformance, getPerformanceHistory } from './performance.service';

export const addPerformanceHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await addPerformance(req.body);
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
};

export const getPerformanceHistoryHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const records = await getPerformanceHistory(req.params.studentId);
    res.json(records);
  } catch (err) {
    next(err);
  }
};

