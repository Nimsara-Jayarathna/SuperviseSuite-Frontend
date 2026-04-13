import { describe, expect, it, vi, beforeEach, Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSupervisorProjectFiles } from './useSupervisorProjectFiles';
import { supervisorFilesApi } from '../api/supervisorFilesApi';
import type { ProjectFile, ProjectFileConfig } from '../types';
import { ApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';

vi.mock('../api/supervisorFilesApi', () => ({
  supervisorFilesApi: {
    list: vi.fn(),
    delete: vi.fn(),
    getDownloadUrl: vi.fn(),
  },
}));

describe('useSupervisorProjectFiles', () => {
  const mockConfig: ProjectFileConfig = {
    maxFileSizeBytes: 10485760,
    maxFileNameLength: 50,
    allowedTypes: ['pdf', 'zip'],
    presignedUrlExpirySeconds: 300,
  };

  const mockFile: (id: string, name: string) => ProjectFile = (id, name) => ({
    id,
    fileName: name,
    fileType: 'pdf',
    fileSize: 1024,
    s3Key: `s3-${id}`,
    uploadedByRole: 'SUPERVISOR',
    uploadedBy: 'dummy-supervisor',
    uploadedByName: 'John Doe',
    createdAt: '2023-01-01T00:00:00Z',
  });

  const dummyError: ApiError = {
    code: 'ERROR',
    message: 'Test Error',
    details: [],
    timestamp: '2023-01-01T00:00:00Z',
    status: 400,
    error: 'Bad Request',
    path: '',
    traceId: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useSupervisorProjectFiles('project-1'));
    expect(result.current.files).toEqual([]);
    expect(result.current.config).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.hasLoaded).toBe(false);
  });

  it('loads files successfully when not lazy', async () => {
    (supervisorFilesApi.list as Mock).mockResolvedValue({
      files: [mockFile('1', 'test.pdf')],
      config: mockConfig,
    });

    const { result } = renderHook(() => useSupervisorProjectFiles('project-1', false));

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for the async effect
    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.files).toHaveLength(1);
    expect(result.current.config).toEqual(mockConfig);
    expect(result.current.hasLoaded).toBe(true);
  });

  it('handles load error', async () => {
    (supervisorFilesApi.list as Mock).mockRejectedValue(new ApiException(dummyError));

    const { result } = renderHook(() => useSupervisorProjectFiles('project-1', false));

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(dummyError);
    expect(result.current.files).toHaveLength(0);
  });

  it('allows manual seed', () => {
    const { result } = renderHook(() => useSupervisorProjectFiles('project-1'));

    act(() => {
      result.current.seed([mockFile('1', 'test.pdf')], mockConfig);
    });

    expect(result.current.files).toHaveLength(1);
    expect(result.current.config).toEqual(mockConfig);
    expect(result.current.hasLoaded).toBe(true);
  });

  it('allows injecting an uploaded file', () => {
    const { result } = renderHook(() => useSupervisorProjectFiles('project-1'));

    const file = mockFile('1', 'test.pdf');
    act(() => {
      result.current.addUploadedFile(file);
    });

    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0]).toEqual(file);
  });

  it('allows deleting a file successfully', async () => {
    const { result } = renderHook(() => useSupervisorProjectFiles('project-1'));
    (supervisorFilesApi.delete as Mock).mockResolvedValue(undefined);

    act(() => {
      result.current.seed([mockFile('1', 'test.pdf'), mockFile('2', 'other.pdf')], mockConfig);
    });

    await act(async () => {
      await result.current.deleteFile('1');
    });

    expect(supervisorFilesApi.delete).toHaveBeenCalledWith('project-1', '1');

    act(() => {
      result.current.removeDeletedFile('1'); // Simulated as component calling this usually or effect
    });

    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0].id).toBe('2');
  });

  it('handles delete error', async () => {
    const { result } = renderHook(() => useSupervisorProjectFiles('project-1'));
    (supervisorFilesApi.delete as Mock).mockRejectedValue(new ApiException(dummyError));

    let res: { ok: boolean; error?: ApiError } | undefined;
    await act(async () => {
      res = await result.current.deleteFile('1');
    });

    expect(res?.ok).toBe(false);
    expect(res?.error).toEqual(dummyError);
  });

  it('can open download target', async () => {
    const { result } = renderHook(() => useSupervisorProjectFiles('project-1'));
    (supervisorFilesApi.getDownloadUrl as Mock).mockResolvedValue('https://download.com/123');

    // mock window.open
    const originalOpen = window.open;
    const openMock = vi.fn();
    window.open = openMock;

    await act(async () => {
      await result.current.downloadFile('1');
    });

    expect(supervisorFilesApi.getDownloadUrl).toHaveBeenCalledWith('project-1', '1');
    expect(openMock).toHaveBeenCalledWith(
      'https://download.com/123',
      '_blank',
      'noopener,noreferrer',
    );

    // restore
    window.open = originalOpen;
  });
});
