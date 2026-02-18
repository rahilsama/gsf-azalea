import { prisma } from '../../prisma/client';
import type { AddPerformanceInput } from './performance.schemas';

export const addPerformance = async (data: AddPerformanceInput) => {
  const record = await prisma.performance.create({
    data: {
      studentId: data.studentId,
      subject: data.subject,
      marks: data.marks,
      examDate: data.examDate,
    },
  });
  return record;
};

export const getPerformanceHistory = async (studentId: string) => {
  const records = await prisma.performance.findMany({
    where: { studentId },
    orderBy: { examDate: 'desc' },
  });
  return records;
};

