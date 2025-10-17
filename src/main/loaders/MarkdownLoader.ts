import { promises as fs } from 'fs';
import { ILoader, LoaderResult } from './ILoader';

export class MarkdownLoader extends ILoader {
  getFileExtensions(): string[] {
    return ['.md', '.markdown'];
  }

  canLoad(filePath: string): boolean {
    const ext = filePath.toLowerCase().split('.').pop();
    return ext === 'md' || ext === 'markdown';
  }

  async load(filePath: string): Promise<LoaderResult> {
    const content = await fs.readFile(filePath, 'utf-8');
    const title = this.extractTitleFromMarkdown(content) || this.extractTitle(filePath);
    
    // Remove markdown syntax for indexing while preserving content
    const cleanContent = this.cleanMarkdown(content);
    
    return {
      content: cleanContent,
      title,
      metadata: {
        language: 'markdown',
        wordCount: cleanContent.split(/\s+/).length,
        headings: this.extractHeadings(content),
        links: this.extractLinks(content),
      },
    };
  }

  private extractTitleFromMarkdown(content: string): string | null {
    // Look for first H1 heading
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) {
      return h1Match[1].trim();
    }
    
    // Look for title in frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const titleMatch = frontmatterMatch[1].match(/^title:\s*['"]?([^'"]+)['"]?$/m);
      if (titleMatch) {
        return titleMatch[1].trim();
      }
    }
    
    return null;
  }

  private cleanMarkdown(content: string): string {
    return content
      // Remove frontmatter
      .replace(/^---\n[\s\S]*?\n---\n?/m, '')
      // Remove markdown syntax but keep content
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

  private extractHeadings(content: string): string[] {
    const headings: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        headings.push(match[2].trim());
      }
    }
    
    return headings;
  }

  private extractLinks(content: string): string[] {
    const links: string[] = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      links.push(match[2]);
    }
    
    return links;
  }
}