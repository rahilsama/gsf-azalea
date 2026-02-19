import { prisma } from '../../prisma/client';
import type { ListStudentsInput, CreateStudentPayload, UpdateStudentPayload } from './student.schemas';

// ── Helpers ──

const studentIncludes = {
  family: {
    include: { centre: true },
  },
  enrollments: {
    include: { school: true },
    orderBy: { academicYear: 'desc' as const },
  },
  processLog: true,
};

// ── List ──

export const listStudents = async (query: ListStudentsInput) => {
  const { page, limit, search, status, academicYear } = query;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { fatherName: { contains: search, mode: 'insensitive' } },
      { enrollments: { some: { school: { name: { contains: search, mode: 'insensitive' } } } } },
      { family: { phone: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (academicYear) {
    where.enrollments = { some: { academicYear } };
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: studentIncludes,
      skip,
      take: limit,
      orderBy: { serialNumber: 'asc' },
    }),
    prisma.student.count({ where }),
  ]);

  return { students, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// ── Get by ID ──

export const getStudentById = async (id: string) => {
  return prisma.student.findUnique({
    where: { id },
    include: studentIncludes,
  });
};

// ── Create ──

export const createStudent = async (data: CreateStudentPayload) => {
  // 1. Resolve or create centre
  let centreId: string | undefined;
  if (data.leb && data.centreName) {
    const centre = await prisma.centre.upsert({
      where: { leb_name: { leb: data.leb, name: data.centreName } },
      update: {},
      create: { leb: data.leb, name: data.centreName },
    });
    centreId = centre.id;
  }

  // 2. Resolve or create family
  let familyId = data.familyId;
  if (!familyId) {
    const family = await prisma.family.create({
      data: {
        phone: data.phone || null,
        email: data.email || null,
        background: data.background || null,
        economicCategory: data.economicCategory || 'LIG',
        centreId: centreId || null,
      },
    });
    familyId = family.id;
  }

  // 3. Resolve or create school
  let schoolId = data.schoolId || undefined;
  if (!schoolId && data.schoolName) {
    const school = await prisma.school.upsert({
      where: { name: data.schoolName },
      update: {},
      create: { name: data.schoolName },
    });
    schoolId = school.id;
  }

  // 4. Create student
  const student = await prisma.student.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      fatherName: data.fatherName || null,
      dob: data.dob ? new Date(data.dob) : null,
      pid: data.pid || null,
      familyId,
      status: data.status || 'active',
      // Create an enrollment if school is provided
      ...(schoolId && {
        enrollments: {
          create: {
            schoolId,
            academicYear: data.academicYear || '2022-23',
            standard: data.standard || null,
          },
        },
      }),
    },
    include: studentIncludes,
  });

  return student;
};

// ── Update ──

export const updateStudent = async (id: string, data: UpdateStudentPayload) => {
  const updateData: any = {};

  if (data.firstName) updateData.firstName = data.firstName;
  if (data.lastName) updateData.lastName = data.lastName;
  if (data.fatherName !== undefined) updateData.fatherName = data.fatherName;
  if (data.dob) updateData.dob = new Date(data.dob);
  if (data.status) updateData.status = data.status;
  if (data.pid !== undefined) updateData.pid = data.pid;

  const student = await prisma.student.update({
    where: { id },
    data: updateData,
    include: studentIncludes,
  });

  return student;
};

// ── Delete ──

export const deleteStudent = async (id: string) => {
  // Enrollments and process_logs cascade automatically
  return prisma.student.delete({ where: { id } });
};
