import { z } from 'zod';

export const createStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  fatherName: z.string().min(1, "Father's name is required"),
  grade: z.string().min(1, 'Grade is required'),
  enrollmentDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  status: z.enum(['active', 'inactive']).default('active'),

  // School info — either provide an existing schoolId or full school details
  schoolId: z.string().uuid().optional(),
  schoolName: z.string().min(1).optional(),
  schoolCurriculum: z.string().min(1).optional(),
  schoolLocation: z.string().min(1).optional(),

  // Parent info
  parentFirstName: z.string().min(1).optional(),
  parentLastName: z.string().min(1).optional(),
  parentPhone: z.string().optional(),
}).refine(
  (data) => data.schoolId || data.schoolName,
  { message: 'Either schoolId or schoolName must be provided', path: ['schoolName'] },
);

export const updateStudentSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  fatherName: z.string().min(1).optional(),
  grade: z.string().min(1).optional(),
  enrollmentDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  status: z.enum(['active', 'inactive']).optional(),

  schoolId: z.string().uuid().optional(),
  schoolName: z.string().min(1).optional(),
  schoolCurriculum: z.string().min(1).optional(),
  schoolLocation: z.string().min(1).optional(),

  parentFirstName: z.string().min(1).optional(),
  parentLastName: z.string().min(1).optional(),
  parentPhone: z.string().optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
