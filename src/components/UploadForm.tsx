'use client';

import { useState } from 'react';
import { uploadFile, validateFile, formatFileSize, type ApiError } from '@/utils/api';

interface UploadFormProps {
  onUploadComplete?: (fileUrl: string) => void;
}

export default function UploadForm({ onUploadComplete }: UploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate the file before setting it
      const validation = validateFile(file);
      if (!validation.isValid) {
        setUploadMessage(validation.error || 'Invalid file');
        return;
      }
      
      setSelectedFile(file);
      setUploadMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage('Please select a file first');
      return;
    }

    // Validate file again before upload
    const validation = validateFile(selectedFile);
    if (!validation.isValid) {
      setUploadMessage(validation.error || 'Invalid file');
      return;
    }

    setIsUploading(true);
    setUploadMessage('');

    try {
      const result = await uploadFile(selectedFile);
      
      // Use the file URL from the response
      const uploadedFileUrl = result.fileUrl || `/api/files/${result.fileName}`;
      setFileUrl(uploadedFileUrl);
      setUploadMessage(`File uploaded successfully: ${result.fileName}`);
      
      // Call the callback if provided
      if (onUploadComplete) {
        onUploadComplete(uploadedFileUrl);
      }
    } catch (error) {
      const apiError = error as ApiError;
      setUploadMessage(apiError.message || 'Upload failed. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setFileUrl('');
    setUploadMessage('');
    // Reset the file input
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Upload File</h2>
      
      {/* File Selection */}
      <div className="mb-4">
        <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-2">
          Choose File
        </label>
        <input
          id="file-input"
          type="file"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-medium
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {selectedFile && (
          <p className="mt-2 text-sm text-gray-600">
            Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
          </p>
        )}
      </div>

      {/* Upload Button */}
      <div className="mb-4">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200"
        >
          {isUploading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </span>
          ) : (
            'Upload'
          )}
        </button>
      </div>

      {/* Status Messages */}
      {uploadMessage && (
        <div className={`mb-4 p-3 rounded-md text-sm ${
          uploadMessage.includes('successfully') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {uploadMessage}
        </div>
      )}

      {/* File URL Display */}
      {fileUrl && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md border">
          <p className="text-sm font-medium text-gray-700 mb-1">File URL:</p>
          <p className="text-sm text-gray-600 break-all">{fileUrl}</p>
        </div>
      )}

      {/* Reset Button */}
      {(selectedFile || fileUrl) && (
        <button
          onClick={handleReset}
          disabled={isUploading}
          className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 
            focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200"
        >
          Reset
        </button>
      )}
    </div>
  );
}
