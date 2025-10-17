// import Database from 'better-sqlite3';
// import { join } from 'path';
// import { existsSync, mkdirSync } from 'fs';
// import { homedir } from 'os';

// export interface DatabaseDocument {
//   id: string;
//   path: string;
//   title: string;
//   content: string;
//   content_type: string;
//   size: number;
//   modified_at: number;
//   created_at: number;
//   metadata: string; // JSON string
// }

// export interface SearchResultRow extends DatabaseDocument {
//   score: number;
//   snippet: string;
// }

// export class DatabaseManager {
//   private db: Database.Database;
//   private dataDir: string;

//   constructor() {
//     this.dataDir = join(homedir(), '.periscope');
//     if (!existsSync(this.dataDir)) {
//       mkdirSync(this.dataDir, { recursive: true });
//     }

//     const dbPath = join(this.dataDir, 'index.db');
//     this.db = new Database(dbPath);
//     this.initializeDatabase();
//   }

//   private initializeDatabase(): void {
//     // Enable FTS5
//     this.db.pragma('journal_mode = WAL');
    
//     // Create documents table
//     this.db.exec(`
//       CREATE TABLE IF NOT EXISTS documents (
//         id TEXT PRIMARY KEY,
//         path TEXT UNIQUE NOT NULL,
//         title TEXT NOT NULL,
//         content TEXT NOT NULL,
//         content_type TEXT NOT NULL,
//         size INTEGER NOT NULL,
//         modified_at INTEGER NOT NULL,
//         created_at INTEGER NOT NULL,
//         metadata TEXT NOT NULL DEFAULT '{}'
//       )
//     `);

//     // Create FTS5 virtual table for full-text search
//     this.db.exec(`
//       CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
//         title, content, content_type, path,
//         content='documents',
//         content_rowid='rowid'
//       )
//     `);

//     // Create triggers to keep FTS table in sync
//     this.db.exec(`
//       CREATE TRIGGER IF NOT EXISTS documents_ai AFTER INSERT ON documents BEGIN
//         INSERT INTO documents_fts(rowid, title, content, content_type, path)
//         VALUES (new.rowid, new.title, new.content, new.content_type, new.path);
//       END
//     `);

//     this.db.exec(`
//       CREATE TRIGGER IF NOT EXISTS documents_ad AFTER DELETE ON documents BEGIN
//         INSERT INTO documents_fts(documents_fts, rowid, title, content, content_type, path)
//         VALUES ('delete', old.rowid, old.title, old.content, old.content_type, old.path);
//       END
//     `);

//     this.db.exec(`
//       CREATE TRIGGER IF NOT EXISTS documents_au AFTER UPDATE ON documents BEGIN
//         INSERT INTO documents_fts(documents_fts, rowid, title, content, content_type, path)
//         VALUES ('delete', old.rowid, old.title, old.content, old.content_type, old.path);
//         INSERT INTO documents_fts(rowid, title, content, content_type, path)
//         VALUES (new.rowid, new.title, new.content, new.content_type, new.path);
//       END
//     `);

//     // Create indexes for better performance
//     this.db.exec(`
//       CREATE INDEX IF NOT EXISTS idx_documents_path ON documents(path);
//       CREATE INDEX IF NOT EXISTS idx_documents_content_type ON documents(content_type);
//       CREATE INDEX IF NOT EXISTS idx_documents_modified_at ON documents(modified_at);
//     `);
//   }

//   insertDocument(doc: Omit<DatabaseDocument, 'id'>): string {
//     const id = this.generateId(doc.path);
//     const stmt = this.db.prepare(`
//       INSERT OR REPLACE INTO documents 
//       (id, path, title, content, content_type, size, modified_at, created_at, metadata)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `);

//     stmt.run(
//       id,
//       doc.path,
//       doc.title,
//       doc.content,
//       doc.content_type,
//       doc.size,
//       doc.modified_at,
//       doc.created_at,
//       doc.metadata
//     );

//     return id;
//   }

//   deleteDocument(path: string): boolean {
//     const stmt = this.db.prepare('DELETE FROM documents WHERE path = ?');
//     const result = stmt.run(path);
//     return result.changes > 0;
//   }

//   getDocument(path: string): DatabaseDocument | null {
//     const stmt = this.db.prepare('SELECT * FROM documents WHERE path = ?');
//     return stmt.get(path) as DatabaseDocument || null;
//   }

//   search(query: string, limit = 50, offset = 0): SearchResultRow[] {
//     // Use FTS5 match syntax
//     const ftsQuery = this.prepareFtsQuery(query);
    
//     const stmt = this.db.prepare(`
//       SELECT 
//         d.*,
//         rank,
//         snippet(documents_fts, 1, '<mark>', '</mark>', '...', 64) as snippet
//       FROM documents_fts 
//       JOIN documents d ON documents_fts.rowid = d.rowid
//       WHERE documents_fts MATCH ?
//       ORDER BY rank
//       LIMIT ? OFFSET ?
//     `);

//     const results = stmt.all(ftsQuery, limit, offset) as (DatabaseDocument & { rank: number; snippet: string })[];
    
//     return results.map(row => ({
//       ...row,
//       score: row.rank,
//     }));
//   }

//   getStats(): { totalDocuments: number; totalSize: number; lastIndexed: Date } {
//     const stmt = this.db.prepare(`
//       SELECT 
//         COUNT(*) as totalDocuments,
//         SUM(size) as totalSize,
//         MAX(created_at) as lastIndexed
//       FROM documents
//     `);
    
//     const result = stmt.get() as { totalDocuments: number; totalSize: number; lastIndexed: number };
    
//     return {
//       totalDocuments: result.totalDocuments,
//       totalSize: result.totalSize || 0,
//       lastIndexed: new Date(result.lastIndexed || 0),
//     };
//   }

//   getAllPaths(): string[] {
//     const stmt = this.db.prepare('SELECT DISTINCT path FROM documents ORDER BY path');
//     const results = stmt.all() as { path: string }[];
//     return results.map(r => r.path);
//   }

//   close(): void {
//     this.db.close();
//   }

//   private generateId(path: string): string {
//     return Buffer.from(path).toString('base64');
//   }

//   private prepareFtsQuery(query: string): string {
//     // Clean and prepare query for FTS5
//     // Remove special characters and prepare for phrase search if needed
//     const cleaned = query
//       .replace(/[^\w\s"]/g, ' ')
//       .replace(/\s+/g, ' ')
//       .trim();

//     if (!cleaned) return '*';

//     // If query contains quotes, treat as phrase search
//     if (cleaned.includes('"')) {
//       return cleaned;
//     }

//     // Split into words and create OR query
//     const words = cleaned.split(' ').filter(w => w.length > 0);
//     if (words.length === 1) {
//       return `${words[0]}*`;
//     }

//     return words.map(word => `${word}*`).join(' OR ');
//   }
// }