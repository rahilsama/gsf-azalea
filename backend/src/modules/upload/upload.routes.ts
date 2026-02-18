import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../../middleware/auth';
import { uploadStudentsHandler } from './upload.controller';
import { Role } from '@prisma/client';

const upload = multer({ storage: multer.memoryStorage() });

export const uploadRouter = Router();

/**
 * @openapi
 * /api/upload/students:
 *   post:
 *     summary: Upload Excel file to import students (admin only)
 *     tags:
 *       - Upload
 */
uploadRouter.post(
  '/students',
  authenticate,
  authorize(Role.ADMIN),
  upload.single('file'),
  uploadStudentsHandler,
);

