import { DocumentLoader } from '../../shared/types';
import { FilePayload } from '../fetcher/IFetcher';
import { Indexable } from '../indexer/Indexable';
import { ILoader, LoaderResult } from './ILoader';

export type JupyterNotebookCellMarkdown = {
  cell_type: 'markdown';
  metadata: Record<string, any>;
  source: string[];
}

export type JupyterNotebookCodeOutputStream = {
  output_type: 'stream';
  name: 'stdout' | 'stderr';
  text: string[];
}

export type JupyterNotebookCodeDisplayOutput = {
  output_type: 'display_data';
  data: Record<string, string | any>; // base64 string OR JSON if mime type ends in '+json'
  metadata: Record<string, any>;
}

export type JupyterNotebookCodeExecuteResult = {
  output_type: 'execute_result';
  execution_count: number | null | undefined;
  data: Record<string, string | any>; // base64 string OR JSON if mime type ends in '+json'
  metadata: Record<string, any>;
}

export type JupyterNotebookCellCodeOutput = JupyterNotebookCodeOutputStream
  | JupyterNotebookCodeDisplayOutput
  | JupyterNotebookCodeExecuteResult;

export type JupyterNotebookCellCode = {
  cell_type: 'code';
  execution_count: number | null | undefined;
  metadata: Record<string, any>;
  source: string[];
  outputs: JupyterNotebookCellCodeOutput[];
}

export type JupyterNotebookCell = JupyterNotebookCellMarkdown | JupyterNotebookCellCode;

export type JupyterNotebook = {
  metadata: {
    kernel_info?: {
      name: string;
      [key: string]: any;
    },
    language_info?: {
      name: string;
      [key: string]: any;
    },
    [key: string]: any;
  },
  cells: JupyterNotebookCell[],
  nbformat: number,
  nbformat_minor: number,
  [key: string]: any; // Allow additional properties
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
