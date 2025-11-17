/**
 * Periscope - Main database
 * 
 * Simple SQlite3 database for storing periscope application data.
 * Note: this isn't necessarily used for indexing/searching.
 */

import sqlite3, { RunResult } from '@vscode/sqlite3';
import { allAsyncQuery, runAsyncQuery } from '../utils/Sqlite3PromiseRun';

export class MainDB {
  private db: sqlite3.Database | null = null;

  async open(path: string): Promise<void> {
    this.db = new sqlite3.Database(path);
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  async vacuum(): Promise<void> {
    if (!this.db)
      throw new Error("Database not initialized.");
    
    await runAsyncQuery(this.db, `VACUUM;`, []);
  }

  async queryWithoutResults(sql: string, params: any[] = []): Promise<RunResult> {
    return await runAsyncQuery(this.db!, sql, params);
  }

  async queryWithResults<T>(sql: string, params: any[] = []): Promise<T[]> {
    return await allAsyncQuery<T>(this.db!, sql, params);
  }

  async getDB(): Promise<sqlite3.Database> {
    if (!this.db)
      throw new Error("Database not initialized.");
    
    return this.db;
  }
}
