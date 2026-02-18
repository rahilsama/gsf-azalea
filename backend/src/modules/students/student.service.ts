import { prisma } from '../../prisma/client';
import type { CreateStudentInput, UpdateStudentInput } from './student.schemas';

/**
 * Resolve or create a School record.
 * If schoolId is given, use it directly.
 * Otherwise, upsert by schoolName so duplicates are never created.
 */
async function resolveSchoolId(data: {
  schoolId?: string;
  schoolName?: string;
  schoolCurriculum?: string;
  schoolLocation?: string;
}): Promise<string> {
  if (data.schoolId) {
    // Verify it exists
    const school = await prisma.school.findUnique({ where: { id: data.schoolId } });
    if (!school) {
      const error = new Error('School not found') as Error & { statusCode?: number };
      error.statusCode = 404;
      throw error;
    }
    return data.schoolId;
  }

  if (!data.schoolName) {
    const error = new Error('School name is required when schoolId is not provided') as Error & { statusCode?: number };
    error.statusCode = 400;
    throw error;
  }

  // Upsert school — never create duplicates by name
  const school = await prisma.school.upsert({
    where: { name: data.schoolName },
    update: {
      ...(data.schoolCurriculum && { curriculum: data.schoolCurriculum }),
      ...(data.schoolLocation && { location: data.schoolLocation }),
    },
    create: {
      name: data.schoolName,
      curriculum: data.schoolCurriculum || 'Unknown',
      location: data.schoolLocation || 'Unknown',
    },
  });

  return school.id;
}

export const createStudent = async (data: CreateStudentInput) => {
  const schoolId = await resolveSchoolId(data);

  const student = await prisma.student.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      fatherName: data.fatherName,
      grade: data.grade,
      enrollmentDate: data.enrollmentDate || new Date(),
      status: data.status || 'active',
      schoolId,
      ...(data.parentFirstName && {
        parents: {
          create: {
            firstName: data.parentFirstName,
            lastName: data.parentLastName || data.lastName,
            phone: data.parentPhone,
          },
        },
      }),
    },
    include: {
      school: true,
      parents: true,
    },
  });

  return student;
};

export const updateStudent = async (id: string, data: UpdateStudentInput) => {
  // Resolve school if school info was provided
  let schoolId: string | undefined;
  if (data.schoolId || data.schoolName) {
    schoolId = await resolveSchoolId(data);
  }

  const student = await prisma.student.update({
    where: { id },
    data: {
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(data.fatherName && { fatherName: data.fatherName }),
      ...(data.grade && { grade: data.grade }),
      ...(data.enrollmentDate && { enrollmentDate: data.enrollmentDate }),
      ...(data.status && { status: data.status }),
      ...(schoolId && { schoolId }),
    },
    include: {
      school: true,
      parents: true,
    },
  });

  // Update parent info if provided
  if (data.parentFirstName || data.parentLastName || data.parentPhone) {
    const existingParent = await prisma.parent.findFirst({ where: { studentId: id } });
    if (existingParent) {
      await prisma.parent.update({
        where: { id: existingParent.id },
        data: {
          ...(data.parentFirstName && { firstName: data.parentFirstName }),
          ...(data.parentLastName && { lastName: data.parentLastName }),
          ...(data.parentPhone && { phone: data.parentPhone }),
        },
      });
    } else {
      await prisma.parent.create({
        data: {
          firstName: data.parentFirstName || '',
          lastName: data.parentLastName || data.lastName || '',
          phone: data.parentPhone,
          studentId: id,
        },
      });
    }
  }

  // Re-fetch with relations
  return prisma.student.findUnique({
    where: { id },
    include: { school: true, parents: true },
  });
};

export const deleteStudent = async (id: string) => {
  // Parents cascade-delete due to onDelete: Cascade in schema
  await prisma.attendance.deleteMany({ where: { studentId: id } });
  await prisma.performance.deleteMany({ where: { studentId: id } });
  await prisma.parent.deleteMany({ where: { studentId: id } });
  await prisma.student.delete({ where: { id } });
};

export const getStudentById = async (id: string) => {
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      school: true,
      parents: true,
    },
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
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { fatherName: { contains: search, mode: 'insensitive' } },
      { school: { name: { contains: search, mode: 'insensitive' } } },
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
      include: {
        school: true,
        parents: true,
      },
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
