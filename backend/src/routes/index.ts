import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { studentRouter } from '../modules/students/student.routes';
import { attendanceRouter } from '../modules/attendance/attendance.routes';
import { performanceRouter } from '../modules/performance/performance.routes';
import { uploadRouter } from '../modules/upload/upload.routes';
import { dashboardRouter } from '../modules/dashboard/dashboard.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/students', studentRouter);
apiRouter.use('/attendance', attendanceRouter);
apiRouter.use('/performance', performanceRouter);
apiRouter.use('/upload', uploadRouter);
apiRouter.use('/dashboard', dashboardRouter);

