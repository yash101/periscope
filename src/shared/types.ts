export interface SearchResult {
  uri: string;
  score: number;
  snippet: string;
  highlights: Array<{
    start: number;
    end: number;
  }>;
}

export interface SearchQuery {
  query: string;
  filters?: {
    contentType?: string[];
    path?: string;
    modifiedAfter?: Date;
    modifiedBefore?: Date;
  };
  limit?: number;
  offset?: number;
}

export interface IndexStats {
  totalDocuments: number;
  totalSize: number;
  lastIndexed: Date;
  indexedPaths: string[];
}

export interface IndexerConfig {
  module: 'lmdb' | 'opensearch' | 'sqlite3-fts5';
  options?: Record<string, any>;
}

export interface DocumentLoader {
  module: string; // e.g., 'pdf-loader', 'markdown-loader'
  extensions: string[]; // e.g., ['.pdf', '.md']
  options: Record<string, any>;
  priority?: number;
}

export interface DocumentSource {
  module: string; // e.g., 'local-filesystem', 'web-crawler'
  options?: Record<string, any>;
}

export interface LocalFilesystemSourceOptions extends DocumentSource {
  module: 'fs',
  options: {
    paths: string[];
    ignorePatterns?: string[];
    recursive?: boolean;
  }
}

export interface ConfigData {
  sources: DocumentSource[];
  hotkey: string;
  indexDebounceDelay?: number; // seconds to wait after file changes before reindexing
  maxResults: number;
  indexers: IndexerConfig[];
  documentLoaders: DocumentLoader[];
  readOnly: boolean;
  enableUnixSocket?: boolean;
}

export interface IpcEvents {
  // Search
  'search:query': (query: SearchQuery) => Promise<SearchResult[]>;
  'search:index-stats': () => Promise<IndexStats>;
  
  // Config
  'config:get': () => Promise<ConfigData>;
  'config:set': (config: Partial<ConfigData>) => Promise<void>;
  
  // Indexing
  'indexer:start': () => Promise<void>;
  'indexer:stop': () => Promise<void>;
  'indexer:status': () => Promise<{ running: boolean; progress?: number }>;
  
  // Files
  'files:open': (path: string) => Promise<void>;
  'files:reveal': (path: string) => Promise<void>;
  
  // Window
  'window:hide': () => void;
  'window:show': () => void;
  'window:toggle': () => void;
}
