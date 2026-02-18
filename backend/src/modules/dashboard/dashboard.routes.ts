import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { getDashboardSummaryHandler } from './dashboard.controller';

export const dashboardRouter = Router();

/**
 * @openapi
 * /api/dashboard/summary:
 *   get:
 *     summary: Get dashboard metrics
 *     tags:
 *       - Dashboard
 */
dashboardRouter.get('/summary', authenticate, getDashboardSummaryHandler);

