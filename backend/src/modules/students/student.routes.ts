import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  createStudentHandler,
  deleteStudentHandler,
  getStudentByIdHandler,
  listStudentsHandler,
  updateStudentHandler,
} from './student.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { createStudentSchema, updateStudentSchema } from './student.schemas';

export const studentRouter = Router();

/**
 * @openapi
 * /api/students:
 *   get:
 *     summary: List students with pagination and search
 *     tags:
 *       - Students
 */
studentRouter.get('/', authenticate, listStudentsHandler);

/**
 * @openapi
 * /api/students/{id}:
 *   get:
 *     summary: Get student by ID
 *     tags:
 *       - Students
 */
studentRouter.get('/:id', authenticate, getStudentByIdHandler);

/**
 * @openapi
 * /api/students:
 *   post:
 *     summary: Create student (admin only)
 *     tags:
 *       - Students
 */
studentRouter.post(
  '/',
  authenticate,
  authorize(Role.ADMIN),
  validateBody(createStudentSchema),
  createStudentHandler,
);

/**
 * @openapi
 * /api/students/{id}:
 *   put:
 *     summary: Update student (admin only)
 *     tags:
 *       - Students
 */
studentRouter.put(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  validateBody(updateStudentSchema),
  updateStudentHandler,
);

/**
 * @openapi
 * /api/students/{id}:
 *   delete:
 *     summary: Delete student (admin only)
 *     tags:
 *       - Students
 */
studentRouter.delete('/:id', authenticate, authorize(Role.ADMIN), deleteStudentHandler);

