import { prisma } from '../../prisma/client';
import type { CreateStudentInput, UpdateStudentInput } from './student.schemas';

export const createStudent = async (data: CreateStudentInput) => {
  const student = await prisma.student.create({
    data: {
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      grade: data.grade,
      schoolName: data.schoolName,
      guardianName: data.guardianName,
      contactNumber: data.contactNumber,
      enrollmentDate: data.enrollmentDate,
      status: data.status,
    },
  });
  return student;
};

export const updateStudent = async (id: string, data: UpdateStudentInput) => {
  const student = await prisma.student.update({
    where: { id },
    data,
  });
  return student;
};

export const deleteStudent = async (id: string) => {
  await prisma.attendance.deleteMany({ where: { studentId: id } });
  await prisma.performance.deleteMany({ where: { studentId: id } });
  await prisma.student.delete({ where: { id } });
};

export const getStudentById = async (id: string) => {
  const student = await prisma.student.findUnique({
    where: { id },
  });
  if (!student) {
    const error = new Error('Student not found') as Error & { statusCode?: number };
    error.statusCode = 404;
    throw error;
  }
  return student;
};

export const listStudents = async (params: {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
}) => {
  const { page, pageSize, search, status } = params;
  const where: any = {};

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { schoolName: { contains: search, mode: 'insensitive' } },
      { guardianName: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [items, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.student.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

