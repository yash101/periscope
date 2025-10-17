import { Document } from '../../shared/types';

export interface LoaderResult {
  content: string;
  title: string;
  metadata: Record<string, any>;
}

export abstract class ILoader {
  abstract getFileExtensions(): string[];
  abstract canLoad(filePath: string): boolean;
  abstract load(filePath: string): Promise<LoaderResult>;
  
  protected extractTitle(filePath: string, content?: string): string {
    const basename = filePath.split('/').pop() || '';
    return basename.replace(/\.[^/.]+$/, '');
  }
}