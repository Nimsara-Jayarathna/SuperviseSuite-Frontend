import { describe, expect, it, vi, beforeEach, Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStudentProjectFiles } from './useStudentProjectFiles';
import { studentFilesApi } from '../api/studentFilesApi';
import type { ProjectFile, ProjectFileConfig } from '../types';
import { ApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';

vi.mock('../api/studentFilesApi', () => ({
  studentFilesApi: {
    list: vi.fn(),
    getDownloadUrl: vi.fn(),
  },
}));

describe('useStudentProjectFiles', () => {
  const mockConfig: ProjectFileConfig = {
    maxFileSizeBytes: 5242880,
    maxFileNameLength: 80,
    allowedTypes: ['zip', 'doc'],
    presignedUrlExpirySeconds: 600,
  };

  const mockFile: (id: string, name: string) => ProjectFile = (id, name) => ({
    id,
    fileName: name,
    fileType: 'pdf',
    fileSize: 1024,
    s3Key: `s3-${id}`,
    uploadedByRole: 'STUDENT',
    uploadedBy: 'dummy-student',
    uploadedByName: 'Jane Doe',
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
    const { result } = renderHook(() => useStudentProjectFiles('project-1'));
    expect(result.current.files).toEqual([]);
    expect(result.current.config).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.hasLoaded).toBe(false);
  });

  it('loads files successfully when not lazy', async () => {
    (studentFilesApi.list as Mock).mockResolvedValue({
      files: [mockFile('1', 'test.pdf')],
      config: mockConfig,
    });

    const { result } = renderHook(() => useStudentProjectFiles('project-1', false));

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
    (studentFilesApi.list as Mock).mockRejectedValue(new ApiException(dummyError));

    const { result } = renderHook(() => useStudentProjectFiles('project-1', false));

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(dummyError);
    expect(result.current.files).toHaveLength(0);
  });

  it('allows manual seed', () => {
    const { result } = renderHook(() => useStudentProjectFiles('project-1'));

    act(() => {
      result.current.seed([mockFile('1', 'test.pdf')], mockConfig);
    });

    expect(result.current.files).toHaveLength(1);
    expect(result.current.config).toEqual(mockConfig);
    expect(result.current.hasLoaded).toBe(true);
  });

  it('allows injecting an uploaded file', () => {
    const { result } = renderHook(() => useStudentProjectFiles('project-1'));

    const file = mockFile('1', 'test.pdf');
    act(() => {
      result.current.addUploadedFile(file);
    });

    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0]).toEqual(file);
  });

  it('can open download target', async () => {
    const { result } = renderHook(() => useStudentProjectFiles('project-1'));
    (studentFilesApi.getDownloadUrl as Mock).mockResolvedValue('https://download.com/123');

    // mock window.open
    const originalOpen = window.open;
    const openMock = vi.fn();
    window.open = openMock;

    await act(async () => {
      await result.current.downloadFile('1');
    });

    expect(studentFilesApi.getDownloadUrl).toHaveBeenCalledWith('project-1', '1');
    expect(openMock).toHaveBeenCalledWith(
      'https://download.com/123',
      '_blank',
      'noopener,noreferrer',
    );

    // restore
    window.open = originalOpen;
  });
});
