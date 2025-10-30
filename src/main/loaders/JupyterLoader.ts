import { DocumentLoader } from '../../shared/types';
import { FilePayload } from '../fetcher/IFetcher';
import { Indexable } from '../indexer/Indexable';
import { ILoader, LoaderResult } from './ILoader';

interface JupyterCell {
  cell_type: string;
  source: string | string[];
  metadata?: any;
  outputs?: any[];
}

interface JupyterNotebook {
  cells: JupyterCell[];
  metadata: any;
  nbformat: number;
  nbformat_minor: number;
}

export class JupyterLoader extends ILoader {
  // I don't think we actually need to do anything here. Pretty straightforward extraction.
  // For consistency. In the future, may support options like OCR images or extract code cells only, etc.
  async open(config: DocumentLoader): Promise<void> {
  }

  async extract(file: FilePayload, indexable: Indexable): Promise<LoaderResult> {
    throw new Error('Method not implemented.');
  }
}
