export interface UploadResponse {
  success: boolean;
  message: string;
  fileId?: string;
  fileName?: string;
  fileUrl?: string;
}

export interface QuestionRequest {
  question: string;
  fileId?: string;
}

export interface QuestionResponse {
  success: boolean;
  answer?: string;
  message: string;
  confidence?: number;
}

export interface FileUpload {
  file: File;
  preview?: string;
}
