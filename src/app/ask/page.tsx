'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import AskForm from '@/components/AskForm';

function AskContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [fileUrl, setFileUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  useEffect(() => {
    const urlParam = searchParams.get('fileUrl');
    if (urlParam) {
      const decodedUrl = decodeURIComponent(urlParam);
      setFileUrl(decodedUrl);
      
      // Extract filename from the URL
      const name = decodedUrl.split('/').pop() || 'Unknown file';
      // Remove timestamp prefix if present (from our upload naming convention)
      const cleanName = name.replace(/^\d+-/, '');
      setFileName(cleanName);
    }
  }, [searchParams]);

  const handleBackToUpload = () => {
    router.push('/');
  };

  if (!fileUrl) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5C2.962 18.333 3.924 20 5.464 20z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No File Found</h2>
            <p className="text-gray-600 mb-6">No file URL was provided. Please upload a file first.</p>
            <Link 
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Upload a File
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ask Questions</h1>
              <p className="text-gray-600 mt-1">Get AI-powered answers about your document</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleBackToUpload}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                Upload New File
              </button>
              <a 
                href="/complete-demo"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Complete Demo
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* File Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ready to analyze</h3>
                <p className="text-sm text-gray-600">{fileName}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => window.open(fileUrl, '_blank')}
                className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700 transition-colors"
              >
                View File
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(fileUrl)}
                className="bg-gray-600 text-white px-3 py-1 text-sm rounded hover:bg-gray-700 transition-colors"
              >
                Copy URL
              </button>
            </div>
          </div>
        </div>

        {/* Ask Form */}
        <AskForm fileUrl={fileUrl} fileName={fileName} />

        {/* Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-medium text-blue-900 mb-3">💡 Tips for better answers:</h4>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Be specific in your questions</li>
            <li>• Ask about particular sections, data, or concepts in the document</li>
            <li>• Use follow-up questions to dig deeper into topics</li>
            <li>• Reference specific page numbers or sections if applicable</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default function AskPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AskContent />
    </Suspense>
  );
}
