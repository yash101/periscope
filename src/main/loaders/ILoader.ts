import { DocumentLoader } from '../../shared/types';
import { FilePayload } from '../crawler/ICrawler';
import { Indexable } from '../indexer/Indexable';

export interface LoaderResult {
  status: 'success' | 'failure';
  errorMessage?: string;
}

export abstract class ILoader {
  abstract open(config: DocumentLoader): Promise<void>;
  abstract extract(file: FilePayload, indexable: Indexable): Promise<LoaderResult>;
}
