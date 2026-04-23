import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MeetingChannel } from '@/features/meetings/types';

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('@/services/apiClient', () => ({
  apiClient: apiClientMock,
}));

async function loadStudentApi() {
  const module = await import('./studentApi');
  return module.studentApi;
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

describe('studentApi meeting-channels cache', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('deduplicates concurrent meeting-channels requests', async () => {
    const studentApi = await loadStudentApi();
    let resolveGet: ((value: unknown) => void) | null = null;

    vi.mocked(apiClientMock.get).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGet = resolve;
        }),
    );

    const first = studentApi.getProjectMeetingChannels('p-1');
    const second = studentApi.getProjectMeetingChannels('p-1');

    expect(apiClientMock.get).toHaveBeenCalledTimes(1);
    resolveGet?.([channel()]);

    await expect(first).resolves.toEqual([channel()]);
    await expect(second).resolves.toEqual([channel()]);
  });

  it('serves cached meeting-channels responses until forced refresh', async () => {
    const studentApi = await loadStudentApi();
    vi.mocked(apiClientMock.get).mockResolvedValue([channel()]);

    await expect(studentApi.getProjectMeetingChannels('p-1')).resolves.toEqual([channel()]);
    await expect(studentApi.getProjectMeetingChannels('p-1')).resolves.toEqual([channel()]);
    expect(apiClientMock.get).toHaveBeenCalledTimes(1);

    vi.mocked(apiClientMock.get).mockResolvedValue([channel({ id: 'c-2' })]);
    await expect(studentApi.getProjectMeetingChannels('p-1', true)).resolves.toEqual([
      channel({ id: 'c-2' }),
    ]);
    expect(apiClientMock.get).toHaveBeenCalledTimes(2);
  });

  it('patches the cache when creating meeting channels', async () => {
    const studentApi = await loadStudentApi();
    vi.mocked(apiClientMock.get).mockResolvedValue([channel()]);
    await studentApi.getProjectMeetingChannels('p-1');

    const created = channel({
      id: 'c-2',
      createdAt: '2026-04-17T00:00:00.000Z',
    });
    vi.mocked(apiClientMock.post).mockResolvedValue(created);

    await studentApi.createProjectMeetingChannel('p-1', {
      platform: 'ZOOM',
      channelName: 'Weekly sync',
      linkOrIdentifier: 'https://example.com',
    });

    vi.mocked(apiClientMock.get).mockClear();
    const next = await studentApi.getProjectMeetingChannels('p-1');
    expect(apiClientMock.get).not.toHaveBeenCalled();
    expect(next.map((item) => item.id)).toEqual(['c-2', 'c-1']);
  });
});
