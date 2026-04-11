import { apiClient } from '@/services/apiClient';
import type {
  ConfirmUploadRequest,
  ProjectFile,
  ProjectFileListResponse,
  UploadUrlRequest,
  UploadUrlResponse,
} from '../types';

export const supervisorFilesApi = {
  list(projectId: string): Promise<ProjectFileListResponse> {
    return apiClient.get<ProjectFileListResponse>(`/api/supervisor/projects/${projectId}/files`);
  },

  getUploadUrl(projectId: string, payload: UploadUrlRequest): Promise<UploadUrlResponse> {
    return apiClient.post<UploadUrlResponse>(
      `/api/supervisor/projects/${projectId}/files/upload-url`,
      payload,
    );
  },

  confirmUpload(projectId: string, payload: ConfirmUploadRequest): Promise<ProjectFile> {
    return apiClient.post<ProjectFile>(
      `/api/supervisor/projects/${projectId}/files/confirm`,
      payload,
    );
  },

  getDownloadUrl(projectId: string, fileId: string): Promise<string> {
    return apiClient.get<string>(
      `/api/supervisor/projects/${projectId}/files/${fileId}/download-url`,
    );
  },

  delete(projectId: string, fileId: string): Promise<void> {
    return apiClient.del<void>(`/api/supervisor/projects/${projectId}/files/${fileId}`);
  },
};
