import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { addPerformanceSchema } from './performance.schemas';
import { addPerformanceHandler, getPerformanceHistoryHandler } from './performance.controller';

export const performanceRouter = Router();

/**
 * @openapi
 * /api/performance:
 *   post:
 *     summary: Add performance record for a student
 *     tags:
 *       - Performance
 */
performanceRouter.post('/', authenticate, validateBody(addPerformanceSchema), addPerformanceHandler);

/**
 * @openapi
 * /api/performance/student/{studentId}:
 *   get:
 *     summary: Get performance history for a student
 *     tags:
 *       - Performance
 */
performanceRouter.get('/student/:studentId', authenticate, getPerformanceHistoryHandler);

