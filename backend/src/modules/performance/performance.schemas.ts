import { z } from 'zod';

export const addPerformanceSchema = z.object({
  studentId: z.string().uuid(),
  subject: z.string().min(1),
  marks: z.number().int().min(0).max(100),
  examDate: z.string().transform((val) => new Date(val)),
});

export type AddPerformanceInput = z.infer<typeof addPerformanceSchema>;

