'use client';

import { useState } from 'react';
import { askQuestion, type ApiError } from '@/utils/api';

interface AskFormProps {
  fileUrl: string;
  fileName?: string;
}

export default function AskForm({ fileUrl, fileName }: AskFormProps) {
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [confidence, setConfidence] = useState<number | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    if (!fileUrl) {
      setError('No file URL provided');
      return;
    }

    setIsLoading(true);
    setError('');
    setAnswer('');
    setConfidence(undefined);

    try {
      const result = await askQuestion(fileUrl, question.trim());
      
      setAnswer(result.answer || '');
      setConfidence(result.confidence);
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.message || 'Failed to get answer. Please try again.');
      console.error('Ask error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setQuestion('');
    setAnswer('');
    setError('');
    setConfidence(undefined);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Ask a Question</h2>
      
      {/* File Info */}
      {fileName && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Analyzing:</span> {fileName}
          </p>
        </div>
      )}

      {/* Question Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
            Your Question
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What would you like to know about this file?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              resize-none disabled:bg-gray-100"
            rows={4}
            disabled={isLoading}
          />
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isLoading || !question.trim() || !fileUrl}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Getting Answer...
              </span>
            ) : (
              'Ask Question'
            )}
          </button>

          {(question || answer || error) && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 
                focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Answer Display */}
      {answer && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900">Answer</h3>
            {confidence && (
              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                Confidence: {Math.round(confidence * 100)}%
              </span>
            )}
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{answer}</p>
            </div>
          </div>
        </div>
      )}

      {/* No File URL Warning */}
      {!fileUrl && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5C2.962 18.333 3.924 20 5.464 20z" />
            </svg>
            <p className="text-sm text-yellow-800">
              Please upload a file first to ask questions about it.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
