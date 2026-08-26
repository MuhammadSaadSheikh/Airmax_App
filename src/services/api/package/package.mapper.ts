import { ValidationError } from '../errors';
import type {
  BillingCycle,
  InternetPackage,
  PackageCategory,
} from '@/services/packages/models';
import type { PackageBillingPeriodDto, PackageDto } from './package.models';

export class PackageContractError extends ValidationError {
  constructor(field: string) {
    super(`Invalid package response field: ${field}`, 502);
    this.name = 'PackageContractError';
  }
}

const faqs = [
  {
    question: 'When will my new plan activate?',
    answer: 'Plan changes are scheduled for your next billing cycle.',
  },
  {
    question: 'Are there any data limits?',
    answer: 'All listed AIRMAX plans include unlimited internet usage.',
  },
];

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new PackageContractError(field);
  }
  return value;
}

function nullableString(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') throw new PackageContractError(field);
  return value || null;
}

function numericValue(value: unknown, field: string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new PackageContractError(field);
  }
  return parsed;
}

function stringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || !value.every(item => typeof item === 'string')) {
    throw new PackageContractError(field);
  }
  return [...value];
}

function billingCycle(period: PackageBillingPeriodDto): BillingCycle {
  switch (period) {
    case 'MONTHLY':
      return 'monthly';
    case 'QUARTERLY':
      return 'quarterly';
    case 'SEMI_ANNUAL':
      return 'semi-annual';
    case 'ANNUAL':
      return 'yearly';
    default:
      throw new PackageContractError('billingPeriod');
  }
}

function category(speed: number): PackageCategory {
  if (speed <= 30) return 'basic';
  if (speed <= 100) return 'premium';
  return 'ultra';
}

export function mapPackageDto(packageDto: PackageDto): InternetPackage {
  if (!packageDto || typeof packageDto !== 'object') {
    throw new PackageContractError('package');
  }
  if (packageDto.status !== 'ACTIVE' && packageDto.status !== 'INACTIVE') {
    throw new PackageContractError('status');
  }
  const speed = numericValue(packageDto.speedMbps, 'speedMbps');
  const name = requiredString(packageDto.name, 'name');
  const description = nullableString(packageDto.description, 'description');
  return {
    id: requiredString(packageDto.id, 'id'),
    name,
    speed,
    price: numericValue(packageDto.price, 'price'),
    billingCycle: billingCycle(packageDto.billingPeriod),
    features: stringArray(packageDto.features, 'features'),
    benefits: [
      `${speed} Mbps connectivity`,
      `${billingCycle(packageDto.billingPeriod)} billing`,
      'AIRMAX customer support',
    ],
    usersSupported: Math.max(2, Math.round(speed / 12)),
    isRecommended: speed === 100,
    category: category(speed),
    description: description ?? `${name} internet package.`,
    faqs: faqs.map(item => ({ ...item })),
  };
}
