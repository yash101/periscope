import { DocumentLoader } from '../../shared/types';
import { FilePayload } from '../fetcher/IFetcher';
import { Indexable } from '../indexer/Indexable';

export interface LoaderResult {
  content: string;
  title: string;
  metadata: Record<string, any>;
}

export abstract class ILoader {
  abstract open(config: DocumentLoader): Promise<void>;
  abstract extract(file: FilePayload, indexable: Indexable): Promise<LoaderResult>;
}
