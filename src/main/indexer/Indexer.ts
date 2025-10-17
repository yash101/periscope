// import { EventEmitter } from 'events';
// import { promises as fs, Stats } from 'fs';
// import { join, extname } from 'path';
// import * as chokidar from 'chokidar';
// import { DatabaseManager } from '../database/DatabaseManager';
// import { LoaderRegistry } from '../loaders';
// import { Document } from '../../shared/types';

// export interface IndexerOptions {
//   searchPaths: string[];
//   excludePatterns: string[];
//   maxFileSize: number; // in bytes
//   batchSize: number;
// }

// export class Indexer extends EventEmitter {
//   private db: DatabaseManager;
//   private loaderRegistry: LoaderRegistry;
//   private watchers: chokidar.FSWatcher[] = [];
//   private isRunning = false;
//   private indexingQueue: string[] = [];
//   private isProcessingQueue = false;

//   constructor(
//     private options: IndexerOptions,
//     db: DatabaseManager,
//     loaderRegistry: LoaderRegistry
//   ) {
//     super();
//     this.db = db;
//     this.loaderRegistry = loaderRegistry;
//   }

//   async start(): Promise<void> {
//     if (this.isRunning) {
//       return;
//     }

//     this.isRunning = true;
//     this.emit('started');

//     // Initial full index
//     await this.indexAll();

//     // Set up file watchers
//     this.setupWatchers();

//     this.emit('ready');
//   }

//   stop(): void {
//     if (!this.isRunning) {
//       return;
//     }

//     this.isRunning = false;
    
//     // Stop all watchers
//     this.watchers.forEach(watcher => watcher.close());
//     this.watchers = [];

//     this.emit('stopped');
//   }

//   async indexAll(): Promise<void> {
//     this.emit('indexing-started');
    
//     try {
//       for (const searchPath of this.options.searchPaths) {
//         await this.indexDirectory(searchPath);
//       }
//       this.emit('indexing-completed');
//     } catch (error) {
//       this.emit('indexing-error', error);
//       throw error;
//     }
//   }

//   async indexFile(filePath: string): Promise<boolean> {
//     try {
//       // Check if file should be excluded
//       if (this.shouldExclude(filePath)) {
//         return false;
//       }

//       // Check if we have a loader for this file
//       const loader = this.loaderRegistry.getLoader(filePath);
//       if (!loader) {
//         return false;
//       }

//       // Get file stats
//       const stats = await fs.stat(filePath);
      
//       // Check file size limit
//       if (stats.size > this.options.maxFileSize) {
//         console.warn(`File too large, skipping: ${filePath} (${stats.size} bytes)`);
//         return false;
//       }

//       // Check if file has been modified since last index
//       const existingDoc = this.db.getDocument(filePath);
//       if (existingDoc && existingDoc.modified_at >= stats.mtime.getTime()) {
//         return false; // Already up to date
//       }

//       // Load and index the file
//       const result = await loader.load(filePath);
      
//       const doc = {
//         path: filePath,
//         title: result.title,
//         content: result.content,
//         content_type: loader.constructor.name.replace('Loader', '').toLowerCase(),
//         size: stats.size,
//         modified_at: stats.mtime.getTime(),
//         created_at: stats.birthtime.getTime(),
//         metadata: JSON.stringify(result.metadata),
//       };

//       this.db.insertDocument(doc);
//       this.emit('file-indexed', filePath);
//       return true;

//     } catch (error) {
//       this.emit('file-error', filePath, error);
//       console.error(`Error indexing file ${filePath}:`, error);
//       return false;
//     }
//   }

//   private async indexDirectory(dirPath: string): Promise<void> {
//     try {
//       const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
//       for (const entry of entries) {
//         const fullPath = join(dirPath, entry.name);
        
//         if (this.shouldExclude(fullPath)) {
//           continue;
//         }

//         if (entry.isDirectory()) {
//           await this.indexDirectory(fullPath);
//         } else if (entry.isFile()) {
//           await this.indexFile(fullPath);
//         }
//       }
//     } catch (error) {
//       console.error(`Error indexing directory ${dirPath}:`, error);
//       this.emit('directory-error', dirPath, error);
//     }
//   }

//   private setupWatchers(): void {
//     const supportedExtensions = this.loaderRegistry.getSupportedExtensions();
    
//     for (const searchPath of this.options.searchPaths) {
//       const watcher = chokidar.watch(searchPath, {
//         ignored: this.options.excludePatterns,
//         ignoreInitial: true,
//         persistent: true,
//         followSymlinks: false,
//       });

//       watcher
//         .on('add', (path) => this.queueForIndexing(path))
//         .on('change', (path) => this.queueForIndexing(path))
//         .on('unlink', (path) => this.handleFileDeleted(path))
//         .on('error', (error) => this.emit('watcher-error', error));

//       this.watchers.push(watcher);
//     }
//   }

//   private queueForIndexing(filePath: string): void {
//     if (!this.indexingQueue.includes(filePath)) {
//       this.indexingQueue.push(filePath);
//     }
//     this.processQueue();
//   }

//   private async processQueue(): Promise<void> {
//     if (this.isProcessingQueue || this.indexingQueue.length === 0) {
//       return;
//     }

//     this.isProcessingQueue = true;

//     while (this.indexingQueue.length > 0) {
//       const batch = this.indexingQueue.splice(0, this.options.batchSize);
      
//       await Promise.all(
//         batch.map(async (filePath) => {
//           try {
//             await this.indexFile(filePath);
//           } catch (error) {
//             console.error(`Error processing queued file ${filePath}:`, error);
//           }
//         })
//       );

//       // Small delay to prevent overwhelming the system
//       await new Promise(resolve => setTimeout(resolve, 10));
//     }

//     this.isProcessingQueue = false;
//   }

//   private handleFileDeleted(filePath: string): void {
//     try {
//       this.db.deleteDocument(filePath);
//       this.emit('file-deleted', filePath);
//     } catch (error) {
//       console.error(`Error deleting file from index ${filePath}:`, error);
//     }
//   }

//   private shouldExclude(filePath: string): boolean {
//     // Check exclude patterns
//     for (const pattern of this.options.excludePatterns) {
//       if (filePath.includes(pattern)) {
//         return true;
//       }
//     }

//     // Check if extension is supported
//     const ext = extname(filePath).toLowerCase();
//     const supportedExtensions = this.loaderRegistry.getSupportedExtensions();
    
//     return !supportedExtensions.includes(ext);
//   }

//   getStatus(): { running: boolean; queueSize: number } {
//     return {
//       running: this.isRunning,
//       queueSize: this.indexingQueue.length,
//     };
//   }
// }