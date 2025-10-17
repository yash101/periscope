import { contextBridge, ipcRenderer } from 'electron';
import { SearchQuery, SearchResult, IndexStats, ConfigData, IpcEvents } from '../shared/types';

// Define the API that will be available in the renderer process
const electronAPI = {
  // Search
  search: {
    query: (query: SearchQuery): Promise<SearchResult[]> => 
      ipcRenderer.invoke('search:query', query),
    getIndexStats: (): Promise<IndexStats> => 
      ipcRenderer.invoke('search:index-stats'),
  },

  // Config
  config: {
    get: (): Promise<ConfigData> => 
      ipcRenderer.invoke('config:get'),
    set: (config: Partial<ConfigData>): Promise<void> => 
      ipcRenderer.invoke('config:set', config),
  },

  // Indexer
  indexer: {
    start: (): Promise<void> => 
      ipcRenderer.invoke('indexer:start'),
    stop: (): Promise<void> => 
      ipcRenderer.invoke('indexer:stop'),
    getStatus: (): Promise<{ running: boolean; progress?: number }> => 
      ipcRenderer.invoke('indexer:status'),
  },

  // Files
  files: {
    open: (path: string): Promise<void> => 
      ipcRenderer.invoke('files:open', path),
    reveal: (path: string): Promise<void> => 
      ipcRenderer.invoke('files:reveal', path),
  },

  // Window
  window: {
    hide: (): void => 
      ipcRenderer.send('window:hide'),
    show: (): void => 
      ipcRenderer.send('window:show'),
    toggle: (): void => 
      ipcRenderer.send('window:toggle'),
  },

  // Event listeners
  on: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.on(channel, listener);
  },

  off: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.off(channel, listener);
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}