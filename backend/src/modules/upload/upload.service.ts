import * as XLSX from 'xlsx';
import { prisma } from '../../prisma/client';

interface RawStudentRow {
  first_name?: string;
  last_name?: string;
  father_name?: string;
  dob?: string | number;
  school_name?: string;
  school_curriculum?: string;
  school_medium?: string;
  standard?: string;
  academic_year?: string;
  phone?: string | number;
  email?: string;
  background?: string;
  economic_category?: string;
  leb?: string;
  centre?: string;
}

const requiredFields: (keyof RawStudentRow)[] = [
  'first_name',
  'last_name',
];

const excelDateToJSDate = (value: string | number | undefined): Date | null => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') {
    const epoch = new Date(1899, 11, 30);
    return new Date(epoch.getTime() + value * 24 * 60 * 60 * 1000);
  }
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
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

    const missing = requiredFields.filter((field) => !row[field]);
    if (missing.length > 0) {
      errors.push({ row: i + 2, message: `Missing: ${missing.join(', ')}` });
      continue;
    }

    try {
      const firstName = String(row.first_name).trim();
      const lastName = String(row.last_name).trim();
      const fatherName = row.father_name?.toString().trim() || null;
      const dob = excelDateToJSDate(row.dob);
      const econCat = (row.economic_category || 'LIG').toString().toUpperCase().trim();
      const validCat = ['SWB', 'LIG', 'LMIG', 'EWS'].includes(econCat) ? econCat : 'LIG';

      // Centre
      let centreId: string | undefined;
      if (row.leb && row.centre) {
        const centre = await prisma.centre.upsert({
          where: { leb_name: { leb: row.leb.toString().trim(), name: row.centre.toString().trim() } },
          update: {},
          create: { leb: row.leb.toString().trim(), name: row.centre.toString().trim() },
        });
        centreId = centre.id;
      }

      // Family
      const family = await prisma.family.create({
        data: {
          phone: row.phone?.toString().trim() || null,
          email: row.email?.toString().trim() || null,
          background: row.background?.toString().trim() || null,
          economicCategory: validCat,
          centreId: centreId || null,
        },
      });

      // School
      let schoolId: string | undefined;
      if (row.school_name) {
        const school = await prisma.school.upsert({
          where: { name: row.school_name.toString().trim() },
          update: {},
          create: {
            name: row.school_name.toString().trim(),
            curriculum: row.school_curriculum?.toString().trim(),
            medium: row.school_medium?.toString().trim(),
          },
        });
        schoolId = school.id;
      }

      // Student
      const student = await prisma.student.create({
        data: {
          firstName,
          lastName,
          fatherName,
          dob,
          familyId: family.id,
          status: 'active',
          ...(schoolId && {
            enrollments: {
              create: {
                schoolId,
                academicYear: row.academic_year?.toString().trim() || '2022-23',
                standard: row.standard?.toString().trim() || null,
              },
            },
          }),
        },
      });

      createdIds.push(student.id);
    } catch (err: any) {
      errors.push({ row: i + 2, message: err.message ?? 'Unknown error' });
    }
  }

  return { createdCount: createdIds.length, createdIds, errors };
};
