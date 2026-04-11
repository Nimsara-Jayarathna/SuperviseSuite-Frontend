export type ProjectFile = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedByRole: 'SUPERVISOR' | 'STUDENT';
  createdAt: string;
  updatedAt: string | null;
};

export type UploadUrlRequest = {
  fileName: string;
  contentType: string;
};

export type UploadUrlResponse = {
  presignedUrl: string;
  s3Key: string;
};

export type ConfirmUploadRequest = {
  s3Key: string;
  fileName: string;
  fileType: string;
  fileSize: number;
};
