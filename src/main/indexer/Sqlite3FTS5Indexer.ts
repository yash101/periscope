import { IndexerConfig, SearchResult } from "../../shared/types";
import { allAsyncQuery, runAsyncQuery } from "../utils/Sqlite3PromiseRun";
import { IIndexer } from "./IIndexer";
import { Indexable } from "./Indexable";

import sqlite3 from "@vscode/sqlite3";

interface FTS5ResultsRow {
  uri: string;
  score: number;
  snippet: string;
}

export class Sqlite3FTS5Indexer extends IIndexer {
  private options!: Sqlite3FTS5IndexerOptions['options'];
  private db: sqlite3.Database | null = null;

  async open(config: Sqlite3FTS5IndexerOptions): Promise<void> {
    this.options = {
      ...defaultOptions,
      ...config.options,
    };

    // Initialize SQLite3 with FTS5
    this.db = new sqlite3.Database(this.options.path, err => {
    });

    // Set PRAGMA options
    await runAsyncQuery(this.db, `PRAGMA mmap_size = ${this.options.mmapSize};`);
    await runAsyncQuery(this.db, `PRAGMA cache_size = ${this.options.cacheSize};`);
    await runAsyncQuery(this.db, `PRAGMA temp_store = ${this.options.tempStore === 'memory' ? 2 : 0};`);
    await runAsyncQuery(this.db, `PRAGMA locking_mode = ${this.options.lockingMode};`);

    // Create documents table and FTS5 virtual table if not exists
    await runAsyncQuery(this.db, `
      CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
        uri UNINDEXED,
        title,
        content,
        tokenize = '${this.options.tokenizer || 'porter unicode61 remove_diacritics 1 tokenchars "_"'}'
      )
    `);

    await runAsyncQuery(this.db, `
      CREATE TABLE IF NOT EXISTS documents (
        uri TEXT PRIMARY KEY,
        hash TEXT NOT NULL,
        type TEXT NOT NULL,
        last_indexed INTEGER, -- UNIX timestamp
        size_bytes INTEGER
      )
    `);

    await runAsyncQuery(this.db, `
      CREATE VIEW IF NOT EXISTS reindex_queue AS
        SELECT d.uri
        FROM documents d
        LEFT JOIN documents_fts fts ON fts.uri = d.uri
        WHERE d.hash IS NULL
          OR d.last_indexed < strftime('%s', 'now', '-30 days')
          OR fts.uri IS NULL
    `, [
    ]);
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  async index(data: Indexable): Promise<void> {
    if (!this.db)
      throw new Error("Database not initialized.");

    // Prepare content for FTS5 indexing
    let title = data.sections
      .filter(section => ['title', 'header', 'h1'].includes(section.type))
      .map(section => section.content)
      .join(' ');
    
    let content = data.sections
      .filter(section => ![
        'title',
        'header',
        'h1',
        'term', // Exclude glossary terms, they are indexed separately
      ].includes(section.type))
      .map(section => section.content)
      .join('\n\n');

    // Insert or rplace into documents table
    await runAsyncQuery(this.db, `
      INSERT OR REPLACE INTO documents
        (uri, hash, type, last_indexed, size_bytes)
        VALUES (?, ?, ?, strftime('%s', 'now'), ?)
    `, [
      data.uri,
      data.metadata['hash'] || '',
      data.metadata['type'] || 'unknown',
      data.metadata['size_bytes'] ? parseInt(data.metadata['size_bytes'], 10) : 0,
    ]);

    await runAsyncQuery(this.db, `
      INSERT OR REPLACE INTO documents_fts
        (uri, title, content)
        VALUES (?, ?, ?)
    `, [
      data.uri,
      title,
      content,
    ]);
  }

  async remove(uri: string): Promise<void> {
    if (!this.db)
      throw new Error("Database not initialized.");

    await runAsyncQuery(this.db, `
      DELETE FROM documents WHERE uri = ?
    `, [uri]);

    await runAsyncQuery(this.db, `
      DELETE FROM documents_fts WHERE uri = ?
    `, [uri]);
  }

  async search(query: string): Promise<SearchResult[]> {
    if (!this.db)
      throw new Error("Database not initialized.");

    if (!query.trim())
      return [];

    // Check if this is a URI itself
    const results = await allAsyncQuery(this.db, `
      SELECT
        uri,
        bm25(documents_fts) AS score,
        snippet(documents_fts, 2, '<b>', '</b>', '...', 10) AS snippet
      FROM documents_fts
      WHERE uri = ? OR documents_fts MATCH ?
      ORDER BY score ASC
      LIMIT 50
    `, [query, query]) as FTS5ResultsRow[];

    return results.map((row: FTS5ResultsRow) => ({
      uri: row.uri,
      score: row.score,
      snippet: row.snippet,
      highlights: [],
    }));
  }
}

export interface Sqlite3FTS5IndexerOptions extends IndexerConfig {
  module: 'sqlite3-fts5';
  options: {
    path: string;
    tokenizer?: string;
    mmapSize?: number;
    cacheSize?: number;
    tempStore?: 'memory' | 'file';
    lockingMode?: 'normal' | 'exclusive' | 'wal';
  }
}

const defaultOptions: Partial<Sqlite3FTS5IndexerOptions['options']> = {
  tokenizer: 'porter unicode61 remove_diacritics 2',
  mmapSize: 268435456, // 256 MB
  cacheSize: -200000, // 200 MB
  tempStore: 'memory',
  lockingMode: 'normal',
}
