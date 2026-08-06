import {
  runDiagnostics,
  supportService,
  type CreateComplaintInput,
} from '@/services/support';

describe('support service', () => {
  const connectionId = 'AMX-TEST-01';

  it('returns complaint summaries and full timeline details', async () => {
    const complaints = await supportService.getComplaints(connectionId);
    expect(complaints.length).toBeGreaterThan(0);

    const detail = await supportService.getComplaintDetail(
      connectionId,
      complaints[0]!.id,
    );
    expect(detail?.timeline).toHaveLength(4);
    expect(detail?.expectedResolution).toBeTruthy();
  });

  it('creates a trackable complaint with attachments', async () => {
    const input: CreateComplaintInput = {
      category: 'internet',
      title: 'Connection unavailable',
      description: 'The connection has been unavailable since this morning.',
      attachments: [
        { id: 'image-1', type: 'image', uri: 'mock://evidence.jpg' },
      ],
    };
    const created = await supportService.createComplaint(connectionId, input);
    expect(created.status).toBe('submitted');
    expect(created.timeline[0]?.completed).toBe(true);
    expect(created.attachments).toHaveLength(1);

    const complaints = await supportService.getComplaints(connectionId);
    expect(complaints[0]?.id).toBe(created.id);
  });

  it('runs smart diagnostics with an actionable recommendation', async () => {
    const result = await runDiagnostics(connectionId, 'slow-speed');
    expect(result.internetStatus).toBe('connected');
    expect(result.latencyMs).toBeGreaterThan(0);
    expect(result.recommendation.length).toBeGreaterThan(10);
  });
});
