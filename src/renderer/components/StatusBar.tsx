import React from 'react';
import { IndexStats } from '@shared/types';

interface StatusBarProps {
  indexStats: IndexStats | null;
}

export default function StatusBar({ indexStats }: StatusBarProps) {
  if (!indexStats) {
    return (
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Loading index stats...</span>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>
            📁 {formatNumber(indexStats.totalDocuments)} docs
          </span>
          <span>
            💾 {formatBytes(indexStats.totalSize)}
          </span>
          {indexStats.lastIndexed.getTime() > 0 && (
            <span>
              🕒 Last indexed: {formatDate(indexStats.lastIndexed)}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
            ⌘+Shift+Space
          </kbd>
          <span>to toggle</span>
        </div>
      </div>
    </div>
  );
}