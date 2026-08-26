const mockApiRequest = jest.fn();

jest.mock('../src/services/api/client', () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

import {
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  ValidationError,
} from '../src/services/api/errors';
import { liveCustomerService } from '../src/services/api/customer/customer.live.service';

const customerDto = {
  id: '10000000-0000-4000-8000-000000000001',
  userId: '20000000-0000-4000-8000-000000000001',
  accountNumber: 'AIRMAX-1042',
  name: 'Ahmed Khan',
  phone: '+923001234567',
  email: 'ahmed@example.test',
  status: 'ACTIVE',
  billingAddress: 'Billing address',
  serviceAddress: 'Service address',
  cnic: '42101-1234567-1',
  connectionId: 'AMX-1042',
  installationDate: '2025-01-15T00:00:00.000Z',
  routerDetails: { model: 'Huawei HG8145V5', serial: 'HW-1042' },
  createdAt: '2025-01-10T09:00:00.000Z',
  updatedAt: '2026-08-26T09:00:00.000Z',
} as const;

describe('Phase 4.4C production customer service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiRequest.mockResolvedValue(customerDto);
  });

  it('fetches and maps the current Customer profile', async () => {
    await expect(liveCustomerService.getCurrentCustomer()).resolves.toEqual({
      id: customerDto.id,
      accountNumber: 'AIRMAX-1042',
      name: 'Ahmed Khan',
      phone: '+923001234567',
      email: 'ahmed@example.test',
      status: 'active',
      address: 'Service address',
      billingAddress: 'Billing address',
      cnic: '42101-1234567-1',
      connectionId: 'AMX-1042',
      installationDate: '2025-01-15T00:00:00.000Z',
      router: 'Huawei HG8145V5',
      createdAt: '2025-01-10T09:00:00.000Z',
      updatedAt: '2026-08-26T09:00:00.000Z',
    });
    expect(mockApiRequest).toHaveBeenCalledWith('/customers/me');
  });

  it('fetches a Customer by the production Customer.id', async () => {
    await expect(
      liveCustomerService.getCustomerById(customerDto.id),
    ).resolves.toMatchObject({ id: customerDto.id });
    expect(mockApiRequest).toHaveBeenCalledWith(`/customers/${customerDto.id}`);
  });

  it('updates only Customer-owned profile fields', async () => {
    mockApiRequest.mockResolvedValue({
      ...customerDto,
      name: 'Ahmed Updated',
      serviceAddress: 'Updated service address',
    });
    await expect(
      liveCustomerService.updateCustomer(customerDto.id, {
        name: 'Ahmed Updated',
        address: 'Updated service address',
      }),
    ).resolves.toMatchObject({
      name: 'Ahmed Updated',
      address: 'Updated service address',
      phone: customerDto.phone,
      email: customerDto.email,
    });
    const body = JSON.parse(mockApiRequest.mock.calls[0]?.[1]?.body) as Record<
      string,
      unknown
    >;
    expect(mockApiRequest).toHaveBeenCalledWith(
      `/customers/${customerDto.id}`,
      expect.objectContaining({ method: 'PATCH' }),
    );
    expect(body).toEqual({
      name: 'Ahmed Updated',
      serviceAddress: 'Updated service address',
    });
    expect(body).not.toHaveProperty('phone');
    expect(body).not.toHaveProperty('email');
    expect(body).not.toHaveProperty('password');
  });

  it('integrates the admin-only Customer status endpoint without changing ownership', async () => {
    mockApiRequest.mockResolvedValue({ ...customerDto, status: 'SUSPENDED' });
    await expect(
      liveCustomerService.updateCustomerStatus(customerDto.id, 'suspended'),
    ).resolves.toMatchObject({ status: 'suspended' });
    expect(mockApiRequest).toHaveBeenCalledWith(
      `/customers/${customerDto.id}/status`,
      { method: 'PATCH', body: JSON.stringify({ status: 'SUSPENDED' }) },
    );
  });

  it.each([
    [
      'validation',
      new ValidationError('Invalid service address', 422),
      ValidationError,
    ],
    [
      'unauthorized',
      new AuthenticationError('Session expired', 401),
      AuthenticationError,
    ],
    [
      'forbidden cross-customer access',
      new AuthorizationError('Customer access denied', 403),
      AuthorizationError,
    ],
    ['network', new NetworkError('Offline', undefined), NetworkError],
  ])('preserves normalized %s errors', async (_label, error, ErrorType) => {
    mockApiRequest.mockRejectedValue(error);
    await expect(
      liveCustomerService.getCustomerById(customerDto.id),
    ).rejects.toBeInstanceOf(ErrorType);
  });
});
