'use client';

import { useRouter } from 'next/navigation';
import UploadForm from '@/components/UploadForm';

export default function Home() {
  const router = useRouter();

  const handleUploadComplete = (fileUrl: string) => {
    // Navigate to the ask page with the file URL as a query parameter
    const encodedFileUrl = encodeURIComponent(fileUrl);
    router.push(`/ask?fileUrl=${encodedFileUrl}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">VQA SmartDoc</h1>
              <p className="text-gray-600 mt-1">Upload documents and ask questions about them</p>
            </div>
            <div className="flex space-x-3">
              <span className="text-sm text-gray-500 px-3 py-2">
                Production Ready
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Document</h2>
          <p className="text-lg text-gray-600">Upload a document or image to get started with AI-powered question answering</p>
        </div>

        {/* Upload Form */}
        <div className="max-w-md mx-auto mb-12">
          <UploadForm onUploadComplete={handleUploadComplete} />
        </div>

        {/* How it Works */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">How it works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Upload File</h4>
              <p className="text-sm text-gray-600">Choose a PDF document or image file to upload</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-green-600">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Process Document</h4>
              <p className="text-sm text-gray-600">Your file is automatically processed and analyzed</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Ask Questions</h4>
              <p className="text-sm text-gray-600">Get AI-powered answers about your document content</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
