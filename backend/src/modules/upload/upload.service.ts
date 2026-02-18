import * as XLSX from 'xlsx';
import { prisma } from '../../prisma/client';

interface RawStudentRow {
  first_name?: string;
  last_name?: string;
  father_name?: string;
  grade?: string | number;
  school_name?: string;
  school_curriculum?: string;
  school_location?: string;
  parent_first_name?: string;
  parent_last_name?: string;
  parent_phone?: string | number;
  enrollment_date?: string | number;
  status?: string;
}

const requiredFields: (keyof RawStudentRow)[] = [
  'first_name',
  'last_name',
  'father_name',
  'grade',
  'school_name',
];

const excelDateToJSDate = (value: string | number | undefined): Date => {
  if (value === undefined || value === null) {
    return new Date();
  }
  if (typeof value === 'number') {
    // Excel serial date
    const epoch = new Date(1899, 11, 30);
    return new Date(epoch.getTime() + value * 24 * 60 * 60 * 1000);
  }
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
};

export const importStudentsFromWorkbook = async (buffer: Buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const json: RawStudentRow[] = XLSX.utils.sheet_to_json(sheet, { defval: undefined });

  const errors: Array<{ row: number; message: string }> = [];
  const createdIds: string[] = [];

  for (let i = 0; i < json.length; i += 1) {
    const row = json[i];

    // Validate required fields
    const missing = requiredFields.filter((field) => !row[field]);
    if (missing.length > 0) {
      errors.push({
        row: i + 2, // +2 for header + 1-based index
        message: `Missing required fields: ${missing.join(', ')}`,
      });
      // eslint-disable-next-line no-continue
      continue;
    }

    try {
      const firstName = String(row.first_name).trim();
      const lastName = String(row.last_name).trim();
      const fatherName = String(row.father_name).trim();
      const grade = String(row.grade).trim();
      const schoolName = String(row.school_name).trim();
      const status = (row.status || 'active').toString().toLowerCase() === 'inactive' ? 'inactive' : 'active';
      const enrollmentDate = excelDateToJSDate(row.enrollment_date);

      // Upsert school to avoid duplicates
      const school = await prisma.school.upsert({
        where: { name: schoolName },
        update: {},
        create: {
          name: schoolName,
          curriculum: row.school_curriculum?.toString().trim() || 'Unknown',
          location: row.school_location?.toString().trim() || 'Unknown',
        },
      });

      // Check for duplicate student
      const existing = await prisma.student.findFirst({
        where: {
          firstName,
          lastName,
          fatherName,
          schoolId: school.id,
        },
      });

      if (existing) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const student = await prisma.student.create({
        data: {
          firstName,
          lastName,
          fatherName,
          grade,
          enrollmentDate,
          status,
          schoolId: school.id,
          ...(row.parent_first_name && {
            parents: {
              create: {
                firstName: row.parent_first_name.toString().trim(),
                lastName: (row.parent_last_name || lastName).toString().trim(),
                phone: row.parent_phone?.toString().trim(),
              },
            },
          }),
        },
      });

      createdIds.push(student.id);
    } catch (err: any) {
      errors.push({
        row: i + 2,
        message: err.message ?? 'Unknown error while importing row',
      });
    }
  }

  return {
    createdCount: createdIds.length,
    createdIds,
    errors,
  };
};
