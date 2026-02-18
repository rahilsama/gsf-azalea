import type { Request, Response, NextFunction } from 'express';
import { getAttendanceByStudent, getMonthlySummary, markAttendance } from './attendance.service';

export const markAttendanceHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await markAttendance(req.body);
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
};

export const getAttendanceByStudentHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const records = await getAttendanceByStudent(req.params.studentId);
    res.json(records);
  } catch (err) {
    next(err);
  }
};

export const getMonthlySummaryHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const month = parseInt((req.query.month as string) || '1', 10);
    const year = parseInt((req.query.year as string) || new Date().getFullYear().toString(), 10);
    const summary = await getMonthlySummary(req.params.studentId, month, year);
    res.json(summary);
  } catch (err) {
    next(err);
  }
};

