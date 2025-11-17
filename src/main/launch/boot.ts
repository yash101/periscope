/**
 * @file boot.ts
 * @description Bootstrapping code for the application.
 */

import { IIndexer } from "../indexer/IIndexer";
import { Sqlite3FTS5Indexer } from "../indexer/Sqlite3FTS5Indexer";
import { LmdbIndexer } from "../indexer/LmdbIndexer";
import { DocumentLoader, IndexerConfig } from "../../shared/types";

export async function loadIndexers(config: IndexerConfig[]): Promise<IIndexer[]> {
  return config
    .filter(cfg => (cfg.options || {})['disabled'] !== true)
    .map(cfg => {
      switch (cfg.module) {
        case 'sqlite3-fts5':
          const sqliteIndexer = new Sqlite3FTS5Indexer();
          sqliteIndexer.open(cfg as any); // Type casting for simplicity
          return sqliteIndexer;
        // case 'lmdb':
        //   const lmdbIndexer = new LmdbIndexer();
        //   lmdbIndexer.open(cfg as any); // Type casting for simplicity
        //   return lmdbIndexer;
        default:
          console.warn(`Unknown indexer module: ${cfg.module}`);
          return null;
      }
    })
    .filter(indexer => indexer !== null);
}

export async function loadDocumentLoaders(config: DocumentLoader): Promise<any[]> {
  return [];
}
