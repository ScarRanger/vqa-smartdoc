import axios, { AxiosError } from 'axios';
import { config, debugLog, errorLog, isDevelopment } from '@/lib/config';

// API Configuration from config
const API_BASE_URL = config.api.baseUrl;

// Types for API requests and responses
export interface UploadResponse {
  success: boolean;
  message: string;
  fileId?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  uploadId?: string;
}

export interface AskRequest {
  fileUrl: string;
  question: string;
}

export interface AskResponse {
  success: boolean;
  answer?: string;
  message: string;
  confidence?: number;
  fileUrl?: string;
  question?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: string;
}

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add debugging info
apiClient.interceptors.request.use(
  (config) => {
    if (isDevelopment()) {
      debugLog(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    return config;
  },
  (error) => {
    errorLog('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => {
    if (isDevelopment()) {
      debugLog(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error: AxiosError) => {
    errorLog('API Response Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Upload a file to the backend server
 * @param file - The file to upload
 * @returns Promise<UploadResponse>
 * @throws ApiError
 */
export async function uploadFile(file: File): Promise<UploadResponse> {
  try {
    // Validate file before upload
    if (!file) {
      throw new Error('No file provided');
    }

    // Get configuration from config module
    const { maxSizeMB, supportedMimeTypes } = config.upload;
    
    // Validate file type
    if (!(supportedMimeTypes as readonly string[]).includes(file.type)) {
      throw new Error(`Invalid file type. Supported types: ${config.upload.supportedTypes.join(', ')}`);
    }

    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
    if (file.size > maxSize) {
      throw new Error(`File size too large. Maximum size is ${maxSizeMB}MB.`);
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);

    // Make the API request to the backend
    const response = await apiClient.post<UploadResponse>('/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: config.api.uploadTimeout,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && isDevelopment()) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          debugLog(`Upload progress: ${percentCompleted}%`);
        }
      },
    });

    const result = response.data;

    if (!result.success) {
      throw new Error(result.message || 'Upload failed');
    }

    return result;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<UploadResponse>;
      
      if (axiosError.response?.data) {
        // Server responded with an error
        const apiError: ApiError = {
          message: axiosError.response.data.message || 'Upload failed',
          status: axiosError.response.status,
          details: axiosError.response.statusText,
        };
        throw apiError;
      } else if (axiosError.request) {
        // Request was made but no response received
        const apiError: ApiError = {
          message: 'Network error. Please check your connection and try again.',
          details: 'No response from server',
        };
        throw apiError;
      }
    }

    // Handle other types of errors
    const apiError: ApiError = {
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
    throw apiError;
  }
}

/**
 * Ask a question about a file
 * @param fileUrl - The URL of the uploaded file
 * @param question - The question to ask
 * @returns Promise<AskResponse>
 * @throws ApiError
 */
export async function askQuestion(fileUrl: string, question: string): Promise<AskResponse> {
  try {
    // Validate inputs
    if (!fileUrl || fileUrl.trim().length === 0) {
      throw new Error('File URL is required');
    }

    if (!question || question.trim().length === 0) {
      throw new Error('Question is required');
    }

    if (question.length > 1000) {
      throw new Error('Question is too long. Maximum length is 1000 characters.');
    }

    const requestData: AskRequest = {
      fileUrl: fileUrl.trim(),
      question: question.trim(),
    };

    // Make the API request to the backend
    const response = await apiClient.post<AskResponse>('/ask/', requestData, {
      timeout: config.api.vqaTimeout,
    });

    const result = response.data;

    if (!result.success) {
      throw new Error(result.message || 'Failed to get answer');
    }

    return result;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<AskResponse>;
      
      if (axiosError.response?.data) {
        // Server responded with an error
        const apiError: ApiError = {
          message: axiosError.response.data.message || 'Failed to get answer',
          status: axiosError.response.status,
          details: axiosError.response.statusText,
        };
        throw apiError;
      } else if (axiosError.request) {
        // Request was made but no response received
        const apiError: ApiError = {
          message: 'Network error. Please check your connection and try again.',
          details: 'No response from server',
        };
        throw apiError;
      } else if (axiosError.code === 'ECONNABORTED') {
        // Request timeout
        const apiError: ApiError = {
          message: 'Request timeout. The server is taking too long to respond.',
          details: 'Timeout error',
        };
        throw apiError;
      }
    }

    // Handle other types of errors
    const apiError: ApiError = {
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
    throw apiError;
  }
}

/**
 * Check if a file URL is accessible
 * @param fileUrl - The file URL to check
 * @returns Promise<boolean>
 */
export async function checkFileExists(fileUrl: string): Promise<boolean> {
  try {
    const response = await axios.head(fileUrl, {
      timeout: 5000, // 5 seconds timeout for file check
    });
    return response.status === 200;
  } catch (error) {
    console.warn('File check failed:', error);
    return false;
  }
}

/**
 * Get file information from URL
 * @param fileUrl - The file URL
 * @returns Object with file information
 */
export function getFileInfo(fileUrl: string): { name: string; extension: string; cleanName: string } {
  try {
    const fileName = fileUrl.split('/').pop() || 'Unknown file';
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    // Remove timestamp prefix if present (from our upload naming convention)
    const cleanName = fileName.replace(/^\d+-/, '');
    
    return {
      name: fileName,
      extension,
      cleanName,
    };
  } catch {
    return {
      name: 'Unknown file',
      extension: '',
      cleanName: 'Unknown file',
    };
  }
}

/**
 * Format file size in human readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate file before upload
 * @param file - The file to validate
 * @returns Object with validation result
 */
export function validateFile(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'Invalid file type. Only PDF and image files (JPEG, PNG, GIF) are allowed.' 
    };
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: `File size too large. Maximum size is ${formatFileSize(maxSize)}.` 
    };
  }

  if (file.size === 0) {
    return { isValid: false, error: 'File is empty' };
  }

  return { isValid: true };
}
