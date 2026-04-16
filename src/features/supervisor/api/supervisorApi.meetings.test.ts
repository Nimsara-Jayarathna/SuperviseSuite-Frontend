import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MeetingChannel } from '@/features/meetings/types';

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    del: vi.fn(),
  },
}));

vi.mock('@/services/apiClient', () => ({
  apiClient: apiClientMock,
}));

async function loadSupervisorApi() {
  const module = await import('./supervisorApi');
  return module.supervisorApi;
}

function channel(overrides: Partial<MeetingChannel> = {}): MeetingChannel {
  return {
    id: 'c-1',
    projectId: 'p-1',
    platform: 'ZOOM',
    channelName: 'Weekly sync',
    linkOrIdentifier: 'https://example.com',
    addedBy: 'u-1',
    addedByName: 'Student',
    addedByRole: 'STUDENT',
    status: 'PENDING',
    approvedBy: null,
    approvedByName: null,
    approvedAt: null,
    createdAt: '2026-04-16T00:00:00.000Z',
    updatedAt: null,
    ...overrides,
  };
}

describe('supervisorApi meeting-channels cache', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('deduplicates concurrent meeting-channels requests', async () => {
    const supervisorApi = await loadSupervisorApi();
    let resolveGet: ((value: unknown) => void) | null = null;

    vi.mocked(apiClientMock.get).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGet = resolve;
        }),
    );

    const first = supervisorApi.getProjectMeetingChannels('p-1');
    const second = supervisorApi.getProjectMeetingChannels('p-1');

    expect(apiClientMock.get).toHaveBeenCalledTimes(1);
    resolveGet?.([channel()]);

    await expect(first).resolves.toEqual([channel()]);
    await expect(second).resolves.toEqual([channel()]);
  });

  it('serves cached meeting-channels responses until forced refresh', async () => {
    const supervisorApi = await loadSupervisorApi();
    vi.mocked(apiClientMock.get).mockResolvedValue([channel()]);

    await expect(supervisorApi.getProjectMeetingChannels('p-1')).resolves.toEqual([channel()]);
    await expect(supervisorApi.getProjectMeetingChannels('p-1')).resolves.toEqual([channel()]);
    expect(apiClientMock.get).toHaveBeenCalledTimes(1);

    vi.mocked(apiClientMock.get).mockResolvedValue([channel({ id: 'c-2' })]);
    await expect(supervisorApi.getProjectMeetingChannels('p-1', true)).resolves.toEqual([
      channel({ id: 'c-2' }),
    ]);
    expect(apiClientMock.get).toHaveBeenCalledTimes(2);
  });

  it('patches the cache when creating meeting channels', async () => {
    const supervisorApi = await loadSupervisorApi();
    vi.mocked(apiClientMock.get).mockResolvedValue([channel()]);
    await supervisorApi.getProjectMeetingChannels('p-1');

    const created = channel({
      id: 'c-2',
      status: 'APPROVED',
      createdAt: '2026-04-17T00:00:00.000Z',
      approvedBy: 'u-2',
      approvedByName: 'Supervisor',
      approvedAt: '2026-04-17T00:00:00.000Z',
      addedByRole: 'SUPERVISOR',
      addedByName: 'Supervisor',
    });

    vi.mocked(apiClientMock.post).mockResolvedValue(created);
    await supervisorApi.createProjectMeetingChannel('p-1', {
      platform: 'ZOOM',
      channelName: 'Weekly sync',
      linkOrIdentifier: 'https://example.com',
    });

    vi.mocked(apiClientMock.get).mockClear();
    const next = await supervisorApi.getProjectMeetingChannels('p-1');
    expect(apiClientMock.get).not.toHaveBeenCalled();
    expect(next.map((item) => item.id)).toEqual(['c-1', 'c-2']); // pending first
  });
});
