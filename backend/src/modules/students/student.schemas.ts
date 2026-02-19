import { z } from 'zod';

export const ListStudentsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  academicYear: z.string().optional(),
  economicCategory: z.string().optional(),
  schoolName: z.string().optional(),
});

export type ListStudentsInput = z.infer<typeof ListStudentsQuery>;

export const CreateStudentInput = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  fatherName: z.string().optional(),
  dob: z.string().optional(),
  pid: z.string().optional(),
  status: z.string().default('active'),

  // Family info
  familyId: z.string().uuid().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  background: z.string().optional(),
  economicCategory: z.enum(['SWB', 'LIG', 'LMIG', 'EWS']).default('LIG'),

  // Location
  leb: z.string().optional(),
  centreName: z.string().optional(),

  // Enrollment
  schoolId: z.string().uuid().optional(),
  schoolName: z.string().optional(),
  academicYear: z.string().default('2022-23'),
  standard: z.string().optional(),
});

export type CreateStudentPayload = z.infer<typeof CreateStudentInput>;

export const UpdateStudentInput = CreateStudentInput.partial();
export type UpdateStudentPayload = z.infer<typeof UpdateStudentInput>;
