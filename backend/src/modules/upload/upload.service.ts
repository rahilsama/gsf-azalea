import * as XLSX from 'xlsx';
import { prisma } from '../../prisma/client';

interface RawStudentRow {
  full_name?: string;
  date_of_birth?: string | number;
  grade?: string | number;
  school_name?: string;
  guardian_name?: string;
  contact_number?: string | number;
  enrollment_date?: string | number;
  status?: string;
}

const requiredFields: (keyof RawStudentRow)[] = [
  'full_name',
  'date_of_birth',
  'grade',
  'school_name',
  'guardian_name',
  'contact_number',
  'enrollment_date',
];

const excelDateToJSDate = (value: string | number | undefined): Date => {
  if (value === undefined || value === null) {
    throw new Error('Missing date value');
  }
  if (typeof value === 'number') {
    // Excel serial date
    const epoch = new Date(1899, 11, 30);
    return new Date(epoch.getTime() + value * 24 * 60 * 60 * 1000);
  }
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${value}`);
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
      // Skip this row
      // eslint-disable-next-line no-continue
      continue;
    }

    try {
      const fullName = String(row.full_name).trim();
      const grade = String(row.grade).trim();
      const schoolName = String(row.school_name).trim();
      const guardianName = String(row.guardian_name).trim();
      const contactNumber = String(row.contact_number).trim();
      const status = (row.status || 'active').toString().toLowerCase() === 'inactive' ? 'inactive' : 'active';

      const dateOfBirth = excelDateToJSDate(row.date_of_birth);
      const enrollmentDate = excelDateToJSDate(row.enrollment_date);

      // Prevent duplicates based on fullName + dateOfBirth + guardianName
      const existing = await prisma.student.findFirst({
        where: {
          fullName,
          guardianName,
          dateOfBirth,
        },
      });

      if (existing) {
        // Skip duplicates silently; could collect a warning if desired
        // eslint-disable-next-line no-continue
        continue;
      }

      const student = await prisma.student.create({
        data: {
          fullName,
          dateOfBirth,
          grade,
          schoolName,
          guardianName,
          contactNumber,
          enrollmentDate,
          status,
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

