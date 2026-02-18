import { prisma } from '../../prisma/client';

export const getDashboardSummary = async () => {
  const [totalStudents, activeStudents, inactiveStudents] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { status: 'active' } }),
    prisma.student.count({ where: { status: 'inactive' } }),
  ]);

  const attendanceAggregates = await prisma.attendance.groupBy({
    by: ['studentId'],
    _count: { _all: true },
    _sum: { present: true as any },
  } as any);

  let overallAttendancePercentage = 0;
  const belowThreshold: Array<{ studentId: string; attendancePercentage: number }> = [];

  if (attendanceAggregates.length > 0) {
    let totalSessions = 0;
    let totalPresent = 0;

    attendanceAggregates.forEach((agg: any) => {
      const sessions = agg._count._all;
      const presentCount = agg._sum.present ?? 0;
      const percentage = sessions > 0 ? (presentCount / sessions) * 100 : 0;

      totalSessions += sessions;
      totalPresent += presentCount;

      if (percentage < 50) {
        belowThreshold.push({
          studentId: agg.studentId,
          attendancePercentage: percentage,
        });
      }
    });

    overallAttendancePercentage = totalSessions > 0 ? (totalPresent / totalSessions) * 100 : 0;
  }

  const studentsBelow50 = await prisma.student.findMany({
    where: {
      id: {
        in: belowThreshold.map((b) => b.studentId),
      },
    },
  });

  const studentsBelow50WithPercentage = studentsBelow50.map((student) => {
    const agg = belowThreshold.find((b) => b.studentId === student.id);
    return {
      student,
      attendancePercentage: agg?.attendancePercentage ?? 0,
    };
  });

  return {
    totalStudents,
    activeStudents,
    inactiveStudents,
    overallAttendancePercentage,
    studentsBelow50: studentsBelow50WithPercentage,
  };
};

