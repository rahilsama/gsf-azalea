import { prisma } from '../../prisma/client';
import type { MarkAttendanceInput } from './attendance.schemas';

export const markAttendance = async (data: MarkAttendanceInput) => {
  const record = await prisma.attendance.upsert({
    where: {
      studentId_date: {
        studentId: data.studentId,
        date: data.date,
      },
    },
    update: {
      present: data.present,
    },
    create: {
      studentId: data.studentId,
      date: data.date,
      present: data.present,
    },
  });

  return record;
};

export const getAttendanceByStudent = async (studentId: string) => {
  const records = await prisma.attendance.findMany({
    where: { studentId },
    orderBy: { date: 'desc' },
  });
  return records;
};

export const getMonthlySummary = async (studentId: string, month: number, year: number) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const records = await prisma.attendance.findMany({
    where: {
      studentId,
      date: {
        gte: start,
        lt: end,
      },
    },
  });

  const total = records.length;
  const presentCount = records.filter((r) => r.present).length;
  const attendancePercentage = total > 0 ? (presentCount / total) * 100 : 0;

  return {
    studentId,
    month,
    year,
    totalSessions: total,
    presentCount,
    attendancePercentage,
  };
};

