import { IndexerConfig } from "../../shared/types";
import { IIndexer } from "./IIndexer";

export class LmdbIndexer extends IIndexer {
  async open(config: LMDBIndexerOptions): Promise<void> {
  }
}

export interface LMDBIndexerOptions extends IndexerConfig {
  module: 'lmdb',
  options: {
    path: string;
  }
}
