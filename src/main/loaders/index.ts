import { ILoader } from './ILoader';
import { MarkdownLoader } from './MarkdownLoader';
import { JupyterLoader } from './JupyterLoader';

export class LoaderRegistry {
  private loaders: ILoader[] = [];

  constructor() {
    this.registerDefaultLoaders();
  }

  private registerDefaultLoaders(): void {
    this.register(new MarkdownLoader());
    this.register(new JupyterLoader());
  }

  register(loader: ILoader): void {
    this.loaders.push(loader);
  }

  getLoader(filePath: string): ILoader | null {
    for (const loader of this.loaders) {
      if (loader.canLoad(filePath)) {
        return loader;
      }
    }
    return null;
  }

  getSupportedExtensions(): string[] {
    const extensions = new Set<string>();
    for (const loader of this.loaders) {
      loader.getFileExtensions().forEach(ext => extensions.add(ext));
    }
    return Array.from(extensions);
  }

  getLoaders(): ILoader[] {
    return [...this.loaders];
  }
}

export { ILoader, MarkdownLoader, JupyterLoader };