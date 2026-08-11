import { z } from 'zod';
import type { CreatePackageInput } from '@/services/api/packages.models';

const positiveNumber = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine(value => Number.isFinite(Number(value)) && Number(value) > 0, {
      message: `${label} must be greater than zero`,
    });

export const packageInformationSchema = z.object({
  name: z.string().trim().min(1, 'Package name is required'),
  speedMbps: positiveNumber('Speed'),
  price: positiveNumber('Price'),
  durationDays: positiveNumber('Duration'),
  description: z.string().trim(),
  features: z
    .string()
    .trim()
    .refine(
      value => value.split('\n').some(feature => feature.trim().length > 0),
      { message: 'Add at least one package feature' },
    ),
});

export type PackageInformationValues = z.infer<typeof packageInformationSchema>;

export function packageValuesToInput(
  values: PackageInformationValues,
): CreatePackageInput {
  return {
    name: values.name.trim(),
    speedMbps: Number(values.speedMbps),
    price: Number(values.price),
    durationDays: Number(values.durationDays),
    description: values.description.trim() || null,
    features: values.features
      .split('\n')
      .map(feature => feature.trim())
      .filter(Boolean),
  };
}
