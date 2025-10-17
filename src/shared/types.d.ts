export interface Document {
    id: string;
    path: string;
    title: string;
    content: string;
    contentType: string;
    size: number;
    modifiedAt: Date;
    createdAt: Date;
    metadata: Record<string, any>;
}
export interface SearchResult {
    document: Document;
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
export interface ConfigData {
    searchPaths: string[];
    excludePatterns: string[];
    hotkey: string;
    theme: 'light' | 'dark' | 'system';
    maxResults: number;
    indexingEnabled: boolean;
}
export interface IpcEvents {
    'search:query': (query: SearchQuery) => Promise<SearchResult[]>;
    'search:index-stats': () => Promise<IndexStats>;
    'config:get': () => Promise<ConfigData>;
    'config:set': (config: Partial<ConfigData>) => Promise<void>;
    'indexer:start': () => Promise<void>;
    'indexer:stop': () => Promise<void>;
    'indexer:status': () => Promise<{
        running: boolean;
        progress?: number;
    }>;
    'files:open': (path: string) => Promise<void>;
    'files:reveal': (path: string) => Promise<void>;
    'window:hide': () => void;
    'window:show': () => void;
    'window:toggle': () => void;
}
