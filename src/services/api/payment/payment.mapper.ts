import { ValidationError } from '../errors';
import type {
  PaymentAttemptDto,
  PaymentDto,
  PaymentStatusDto,
} from './payment.models';
import type {
  Payment,
  PaymentAttempt,
  PaymentStatus,
} from '@/services/billing/models';

export class PaymentContractError extends ValidationError {
  constructor(field: string) {
    super(`Invalid payment response field: ${field}`, 502);
    this.name = 'PaymentContractError';
  }
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new PaymentContractError(field);
  }
  return value;
}

function nullableString(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') throw new PaymentContractError(field);
  return value || null;
}

function numericValue(value: unknown, field: string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new PaymentContractError(field);
  }
  return parsed;
}

function paymentStatus(status: PaymentStatusDto): PaymentStatus {
  switch (status) {
    case 'SUCCESS':
      return 'completed';
    case 'PENDING':
      return 'pending';
    case 'FAILED':
      return 'failed';
    case 'REFUNDED':
      return 'refunded';
    default:
      throw new PaymentContractError('status');
  }
}

function paymentAttemptStatus(
  status: PaymentAttemptDto['status'],
): PaymentAttempt['status'] {
  if (status === 'SUCCESS') return 'completed';
  if (status === 'PENDING') return 'pending';
  if (status === 'FAILED') return 'failed';
  throw new PaymentContractError('attempt.status');
}

function mapAttempt(attempt: PaymentAttemptDto, index: number): PaymentAttempt {
  if (!attempt || typeof attempt !== 'object') {
    throw new PaymentContractError(`attempts.${index}`);
  }
  if (!['SUCCESS', 'FAILED', 'PENDING'].includes(attempt.status)) {
    throw new PaymentContractError(`attempts.${index}.status`);
  }
  return {
    id: requiredString(attempt.id, `attempts.${index}.id`),
    status: paymentAttemptStatus(attempt.status),
    provider: nullableString(attempt.provider, `attempts.${index}.provider`),
    providerReference: nullableString(
      attempt.providerReference,
      `attempts.${index}.providerReference`,
    ),
    failureReason: nullableString(
      attempt.failureReason,
      `attempts.${index}.failureReason`,
    ),
    attemptedAt: requiredString(
      attempt.attemptedAt,
      `attempts.${index}.attemptedAt`,
    ),
  };
}

export function mapPaymentDto(payment: PaymentDto): Payment {
  if (!payment || typeof payment !== 'object') {
    throw new PaymentContractError('payment');
  }
  if (!Array.isArray(payment.attempts)) {
    throw new PaymentContractError('attempts');
  }
  const id = requiredString(payment.id, 'id');
  const externalReference = nullableString(
    payment.externalReference,
    'externalReference',
  );
  return {
    id,
    invoiceId: requiredString(payment.invoiceId, 'invoiceId'),
    customerId: requiredString(payment.customerId, 'customerId'),
    amount: numericValue(payment.amount, 'amount'),
    method: requiredString(payment.paymentMethod, 'paymentMethod')
      .toLowerCase()
      .replaceAll('_', ' '),
    date: requiredString(payment.createdAt, 'createdAt'),
    status: paymentStatus(payment.status),
    reference: externalReference ?? id,
    externalReference,
    attempts: payment.attempts.map(mapAttempt),
    processedAt: nullableString(payment.processedAt, 'processedAt'),
    refundedAt: nullableString(payment.refundedAt, 'refundedAt'),
  };
}
