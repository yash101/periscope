import React, { useState, useEffect, useRef } from 'react';
import { SearchQuery, SearchResult, IndexStats } from '@shared/types';
import SearchBar from './components/SearchBar';
import SearchResults from './components/SearchResults';
import StatusBar from './components/StatusBar';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [indexStats, setIndexStats] = useState<IndexStats | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load index stats on mount
  useEffect(() => {
    loadIndexStats();
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch();
      }, 300);
    } else {
      setResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const loadIndexStats = async () => {
    try {
      const stats = await window.electronAPI.search.getIndexStats();
      setIndexStats(stats);
    } catch (error) {
      console.error('Failed to load index stats:', error);
    }
  };

  const performSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const searchQuery: SearchQuery = {
        query: query.trim(),
        limit: 50,
      };

      const searchResults = await window.electronAPI.search.query(searchQuery);
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultSelect = async (result: SearchResult) => {
    try {
      await window.electronAPI.files.open(result.document.path);
      window.electronAPI.window.hide();
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const handleResultReveal = async (result: SearchResult) => {
    try {
      await window.electronAPI.files.reveal(result.document.path);
    } catch (error) {
      console.error('Failed to reveal file:', error);
    }
  };

  const handleEscape = () => {
    if (query) {
      setQuery('');
      setResults([]);
    } else {
      window.electronAPI.window.hide();
    }
  };

  return (
    <div className="min-h-screen bg-white/95 backdrop-blur-lg border border-gray-200 rounded-lg shadow-2xl max-w-2xl mx-auto my-8 overflow-hidden">
      <div className="flex flex-col h-full">
        <SearchBar
          query={query}
          onChange={setQuery}
          onEscape={handleEscape}
          isLoading={isLoading}
        />
        
        <div className="flex-1 min-h-0">
          <SearchResults
            results={results}
            onSelect={handleResultSelect}
            onReveal={handleResultReveal}
            isLoading={isLoading}
            query={query}
          />
        </div>

        <StatusBar indexStats={indexStats} />
      </div>
    </div>
  );
}

export default App;