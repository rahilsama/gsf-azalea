import { z } from 'zod';

export const createStudentSchema = z.object({
  fullName: z.string().min(1),
  dateOfBirth: z.string().transform((val) => new Date(val)),
  grade: z.string().min(1),
  schoolName: z.string().min(1),
  guardianName: z.string().min(1),
  contactNumber: z.string().min(5),
  enrollmentDate: z.string().transform((val) => new Date(val)),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const updateStudentSchema = createStudentSchema.partial();

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

