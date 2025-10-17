import { promises as fs } from 'fs';
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
  getFileExtensions(): string[] {
    return ['.ipynb'];
  }

  canLoad(filePath: string): boolean {
    return filePath.toLowerCase().endsWith('.ipynb');
  }

  async load(filePath: string): Promise<LoaderResult> {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const notebook: JupyterNotebook = JSON.parse(fileContent);
    
    const title = this.extractTitleFromNotebook(notebook) || this.extractTitle(filePath);
    const content = this.extractContentFromNotebook(notebook);
    
    return {
      content,
      title,
      metadata: {
        language: 'jupyter',
        nbformat: notebook.nbformat,
        cellCount: notebook.cells.length,
        codeCount: notebook.cells.filter(cell => cell.cell_type === 'code').length,
        markdownCount: notebook.cells.filter(cell => cell.cell_type === 'markdown').length,
        kernelspec: notebook.metadata?.kernelspec,
      },
    };
  }

  private extractTitleFromNotebook(notebook: JupyterNotebook): string | null {
    // Look for title in notebook metadata
    if (notebook.metadata?.title) {
      return notebook.metadata.title;
    }
    
    // Look for first markdown cell with H1
    for (const cell of notebook.cells) {
      if (cell.cell_type === 'markdown') {
        const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
        const h1Match = source.match(/^#\s+(.+)$/m);
        if (h1Match) {
          return h1Match[1].trim();
        }
      }
    }
    
    return null;
  }

  private extractContentFromNotebook(notebook: JupyterNotebook): string {
    const contents: string[] = [];
    
    for (const cell of notebook.cells) {
      const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
      
      if (cell.cell_type === 'markdown') {
        // Clean markdown content
        const cleanedMarkdown = this.cleanMarkdown(source);
        if (cleanedMarkdown.trim()) {
          contents.push(cleanedMarkdown);
        }
      } else if (cell.cell_type === 'code') {
        // Include code content with some cleaning
        const cleanedCode = source
          .replace(/^%.*$/gm, '') // Remove magic commands
          .replace(/^!.*$/gm, '') // Remove shell commands
          .trim();
        
        if (cleanedCode) {
          contents.push(cleanedCode);
        }
        
        // Also include text outputs if available
        if (cell.outputs) {
          for (const output of cell.outputs) {
            if (output.output_type === 'stream' && output.text) {
              const text = Array.isArray(output.text) ? output.text.join('') : output.text;
              contents.push(text.trim());
            } else if (output.output_type === 'execute_result' && output.data?.['text/plain']) {
              const text = Array.isArray(output.data['text/plain']) 
                ? output.data['text/plain'].join('') 
                : output.data['text/plain'];
              contents.push(text.trim());
            }
          }
        }
      }
    }
    
    return contents.join('\n\n');
  }

  private cleanMarkdown(content: string): string {
    return content
      .replace(/^#{1,6}\s+/gm, '') // Headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/`([^`]+)`/g, '$1') // Inline code
      .replace(/```[\s\S]*?```/g, '') // Code blocks
      .replace(/^\s*[-+*]\s+/gm, '') // Lists
      .replace(/^\s*\d+\.\s+/gm, '') // Numbered lists
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // Images
      .trim();
  }
}