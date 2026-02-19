import { prisma } from '../../prisma/client';

export const getDashboardSummary = async () => {
  // Total students
  const totalStudents = await prisma.student.count({ where: { deletedAt: null } });
  const activeStudents = await prisma.student.count({ where: { status: 'active', deletedAt: null } });
  const inactiveStudents = totalStudents - activeStudents;

  // Total schools
  const totalSchools = await prisma.school.count();

  // Total families
  const totalFamilies = await prisma.family.count();

  // Economic category breakdown
  const economicBreakdown = await prisma.family.groupBy({
    by: ['economicCategory'],
    _count: { id: true },
  });

  // Students by academic year
  const enrollmentsByYear = await prisma.enrollment.groupBy({
    by: ['academicYear'],
    _count: { id: true },
    where: { student: { deletedAt: null } }, // Filter enrollments for non-deleted students
  });

  // Financials (aggregating from enrollments)
  // We'll fetch all current enrollments to sum up contributions
  // Financials (aggregating from enrollments)
  const gsfTotals = await prisma.enrollment.aggregate({
    _sum: {
      gsfContribution: true,
      parentContribution: true,
      totalCost: true,
    },
    where: {
      academicYear: '2022-23',
      student: { deletedAt: null }
    },
  });

  // Top schools by enrollment count (2022-23)
  const topSchools = await prisma.school.findMany({
    include: {
      _count: {
        select: { enrollments: true },
      },
    },
    orderBy: {
      enrollments: { _count: 'desc' },
    },
    take: 10,
  });

  // Centres breakdown
  const centreBreakdown = await prisma.centre.findMany({
    include: {
      _count: { select: { families: true } },
    },
    orderBy: { leb: 'asc' },
  });

  return {
    totalStudents,
    activeStudents,
    inactiveStudents,
    totalSchools,
    totalFamilies,
    economicBreakdown: economicBreakdown.map((e) => ({
      category: e.economicCategory,
      count: e._count.id,
    })),
    enrollmentsByYear: enrollmentsByYear.map((e) => ({
      year: e.academicYear,
      count: e._count.id,
    })),
    financials: {
      totalCost: Number(gsfTotals._sum.totalCost || 0),
      totalParentContribution: Number(gsfTotals._sum.parentContribution || 0),
      totalGSFContribution: Number(gsfTotals._sum.gsfContribution || 0),
    },
    topSchools: topSchools.map((s) => ({
      id: s.id,
      name: s.name,
      curriculum: s.curriculum,
      enrollmentCount: s._count.enrollments,
    })),
    centreBreakdown: centreBreakdown.map((c) => ({
      id: c.id,
      leb: c.leb,
      name: c.name,
      familyCount: c._count.families,
    })),
  };
};
