import {
  mockSystemRepository,
  validateMockSystem,
  type MockSystemSnapshot,
} from '@/services/api/mockSystem.repository';

function snapshot(): MockSystemSnapshot {
  mockSystemRepository.reset();
  return mockSystemRepository.snapshot();
}

describe('Phase 3 mock system integrity', () => {
  it('validates every seeded relationship and workflow', () => {
    expect(() => mockSystemRepository.validate()).not.toThrow();
  });

  it.each([
    [
      'subscription customer',
      (state: MockSystemSnapshot) => {
        state.subscriptions[0] = {
          ...state.subscriptions[0]!,
          userId: 'missing',
        };
      },
    ],
    [
      'invoice subscription',
      (state: MockSystemSnapshot) => {
        state.invoices[0] = {
          ...state.invoices[0]!,
          subscriptionId: 'missing',
        };
      },
    ],
    [
      'payment invoice',
      (state: MockSystemSnapshot) => {
        state.payments[0] = { ...state.payments[0]!, invoiceId: 'missing' };
      },
    ],
    [
      'complaint customer',
      (state: MockSystemSnapshot) => {
        state.complaints[0] = { ...state.complaints[0]!, userId: 'missing' };
      },
    ],
  ])('rejects an invalid %s reference', (_label, corrupt) => {
    const state = snapshot();
    corrupt(state);
    expect(() => validateMockSystem(state)).toThrow('integrity failed');
  });

  it('rejects skipped complaint timeline states', () => {
    const state = snapshot();
    const complaint = state.complaints[0]!;
    state.complaints[0] = {
      ...complaint,
      status: 'RESOLVED',
      events: [
        complaint.events[0]!,
        { ...complaint.events[0]!, id: 'invalid-event', status: 'RESOLVED' },
      ],
    };
    expect(() => validateMockSystem(state)).toThrow('invalid timeline');
  });
});
