import { z } from 'zod';

export const markAttendanceSchema = z.object({
  studentId: z.string().uuid(),
  date: z.string().transform((val) => new Date(val)),
  present: z.boolean(),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;

