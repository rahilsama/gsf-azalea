import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { markAttendanceSchema } from './attendance.schemas';
import {
  getAttendanceByStudentHandler,
  getMonthlySummaryHandler,
  markAttendanceHandler,
} from './attendance.controller';

export const attendanceRouter = Router();

/**
 * @openapi
 * /api/attendance:
 *   post:
 *     summary: Mark attendance for a student on a date
 *     tags:
 *       - Attendance
 */
attendanceRouter.post('/', authenticate, validateBody(markAttendanceSchema), markAttendanceHandler);

/**
 * @openapi
 * /api/attendance/student/{studentId}:
 *   get:
 *     summary: Get attendance records for a student
 *     tags:
 *       - Attendance
 */
attendanceRouter.get('/student/:studentId', authenticate, getAttendanceByStudentHandler);

/**
 * @openapi
 * /api/attendance/student/{studentId}/monthly:
 *   get:
 *     summary: Get monthly attendance summary for a student
 *     tags:
 *       - Attendance
 */
attendanceRouter.get('/student/:studentId/monthly', authenticate, getMonthlySummaryHandler);

