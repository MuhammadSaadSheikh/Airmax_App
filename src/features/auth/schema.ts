import { z } from 'zod';
export const loginSchema = z.object({
  identifier: z.string().min(5, 'Enter a valid phone number or email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['customer', 'admin']),
});
export type LoginValues = z.infer<typeof loginSchema>;
