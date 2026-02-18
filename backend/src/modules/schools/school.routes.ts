import { Router } from 'express';
import { listSchoolsHandler, getSchoolByIdHandler } from './school.controller';
import { authenticate } from '../../middleware/auth';

export const schoolRouter = Router();

/**
 * @openapi
 * /api/schools:
 *   get:
 *     summary: List all schools
 *     tags:
 *       - Schools
 */
schoolRouter.get('/', authenticate, listSchoolsHandler);

/**
 * @openapi
 * /api/schools/{id}:
 *   get:
 *     summary: Get school by ID with its students
 *     tags:
 *       - Schools
 */
schoolRouter.get('/:id', authenticate, getSchoolByIdHandler);
