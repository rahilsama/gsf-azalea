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
import { CreateStudentInput, UpdateStudentInput } from './student.schemas';

export const studentRouter = Router();

studentRouter.get('/', authenticate, listStudentsHandler);
studentRouter.get('/:id', authenticate, getStudentByIdHandler);
studentRouter.post('/', authenticate, authorize(Role.ADMIN), validateBody(CreateStudentInput), createStudentHandler);
studentRouter.put('/:id', authenticate, authorize(Role.ADMIN), validateBody(UpdateStudentInput), updateStudentHandler);
studentRouter.delete('/:id', authenticate, authorize(Role.ADMIN), deleteStudentHandler);
