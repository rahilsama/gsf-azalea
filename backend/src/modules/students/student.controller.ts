import type { Request, Response, NextFunction } from 'express';
import {
  createStudent,
  deleteStudent,
  getStudentById,
  listStudents,
  updateStudent,
} from './student.service';

export const createStudentHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = await createStudent(req.body);
    res.status(201).json(student);
  } catch (err) {
    next(err);
  }
};

export const updateStudentHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = await updateStudent(req.params.id, req.body);
    res.json(student);
  } catch (err) {
    next(err);
  }
};

export const deleteStudentHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteStudent(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const getStudentByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = await getStudentById(req.params.id);
    res.json(student);
  } catch (err) {
    next(err);
  }
};

export const listStudentsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const pageSize = parseInt((req.query.pageSize as string) || '10', 10);
    const search = (req.query.search as string) || undefined;
    const status = (req.query.status as string) || undefined;

    const result = await listStudents({ page, pageSize, search, status });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

