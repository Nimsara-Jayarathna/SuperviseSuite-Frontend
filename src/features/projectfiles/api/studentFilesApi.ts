import { apiClient } from '@/services/apiClient';
import type {
  ConfirmUploadRequest,
  ProjectFile,
  ProjectFileListResponse,
  UploadUrlRequest,
  UploadUrlResponse,
} from '../types';

export const studentFilesApi = {
  list(projectId: string): Promise<ProjectFileListResponse> {
    return apiClient.get<ProjectFileListResponse>(`/api/student/projects/${projectId}/files`);
  },

  getUploadUrl(projectId: string, payload: UploadUrlRequest): Promise<UploadUrlResponse> {
    return apiClient.post<UploadUrlResponse>(
      `/api/student/projects/${projectId}/files/upload-url`,
      payload,
    );
  },

  confirmUpload(projectId: string, payload: ConfirmUploadRequest): Promise<ProjectFile> {
    return apiClient.post<ProjectFile>(`/api/student/projects/${projectId}/files/confirm`, payload);
  },

  getDownloadUrl(projectId: string, fileId: string): Promise<string> {
    return apiClient.get<string>(`/api/student/projects/${projectId}/files/${fileId}/download-url`);
  },
};
