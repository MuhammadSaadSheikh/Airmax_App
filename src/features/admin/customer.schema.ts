import { z } from 'zod';

const optionalEmail = z
  .string()
  .trim()
  .refine(value => value.length === 0 || z.email().safeParse(value).success, {
    message: 'Enter a valid email address',
  });

const optionalCnic = z
  .string()
  .trim()
  .refine(value => value.length === 0 || /^\d{5}-\d{7}-\d$/.test(value), {
    message: 'Use CNIC format 42101-1234567-1',
  });

export const customerInformationSchema = z.object({
  name: z.string().trim().min(2, 'Enter the customer name'),
  phone: z.string().trim().min(7, 'Enter a valid phone number'),
  email: optionalEmail,
  address: z.string().trim(),
  cnic: optionalCnic,
});

export type CustomerInformationValues = z.infer<
  typeof customerInformationSchema
>;
