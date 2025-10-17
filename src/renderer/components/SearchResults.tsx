import React from 'react';
import { SearchResult } from '@shared/types';

interface SearchResultsProps {
  results: SearchResult[];
  onSelect: (result: SearchResult) => void;
  onReveal: (result: SearchResult) => void;
  isLoading: boolean;
  query: string;
}

export default function SearchResults({ 
  results, 
  onSelect, 
  onReveal, 
  isLoading, 
  query 
}: SearchResultsProps) {
  if (isLoading && results.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!query.trim()) {
    return (
      <div className="p-8 text-center text-gray-500">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <p className="text-lg font-medium">Start typing to search</p>
        <p className="text-sm">Search through your documents, code, and notes</p>
      </div>
    );
  }

  if (results.length === 0 && !isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-lg font-medium">No results found</p>
        <p className="text-sm">Try adjusting your search terms</p>
      </div>
    );
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  const getFileIcon = (contentType: string): string => {
    switch (contentType.toLowerCase()) {
      case 'markdown':
        return '📝';
      case 'jupyter':
        return '📓';
      case 'javascript':
      case 'typescript':
        return '⚡';
      case 'python':
        return '🐍';
      case 'java':
        return '☕';
      case 'json':
        return '📋';
      default:
        return '📄';
    }
  };

  return (
    <div className="max-h-96 overflow-y-auto">
      {results.map((result, index) => (
        <div
          key={result.document.id}
          className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer"
          onClick={() => onSelect(result)}
        >
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-1">
                  <span className="text-lg mr-2">{getFileIcon(result.document.contentType)}</span>
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {result.document.title}
                  </h3>
                  <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    {result.document.contentType}
                  </span>
                </div>
                
                <p className="text-xs text-gray-500 mb-2 font-mono truncate">
                  {result.document.path}
                </p>

                {result.snippet && (
                  <div 
                    className="text-sm text-gray-700 mb-2"
                    dangerouslySetInnerHTML={{ __html: result.snippet }}
                  />
                )}

                <div className="flex items-center text-xs text-gray-400 space-x-4">
                  <span>{formatFileSize(result.document.size)}</span>
                  <span>{formatDate(result.document.modifiedAt)}</span>
                  <span>Score: {result.score.toFixed(2)}</span>
                </div>
              </div>

              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReveal(result);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Reveal in Finder"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}