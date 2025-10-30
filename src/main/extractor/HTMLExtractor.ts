import { Section } from "../indexer/Indexable";
import * as cheerio from 'cheerio';

export interface HTMLExtractionConfig {
  baseWeights: Record<string, number>;
  inlineMultipliers: Record<string, number>;
  contextMultipliers: Record<string, number>;
  depthDecay: number;
  maxDepth?: number;
  minTextLength?: number;
}

export interface ExtractedSection {
  type: string;
  content: string;
  weight: number;
  depth: number;
  context: string[];
  meta?: Record<string, any>;
}

export class HTMLExtractor {
  private config: HTMLExtractionConfig;

  constructor(config?: Partial<HTMLExtractionConfig>) {
    this.config = {
      baseWeights: { 
        h1: 4, h2: 3, h3: 2.5, h4: 2, h5: 1.8, h6: 1.5,
        p: 1, div: 0.8, span: 0.7, 
        blockquote: 1.2, code: 1.1, pre: 1.3,
        li: 0.9, td: 0.8, th: 1.2,
        article: 1.1, section: 1.0, aside: 0.6,
        ...config?.baseWeights
      },
      inlineMultipliers: { 
        b: 1.3, strong: 1.3, 
        i: 1.1, em: 1.1, 
        mark: 1.4, u: 1.05,
        code: 1.2,
        ...config?.inlineMultipliers 
      },
      contextMultipliers: { 
        blockquote: 1.4, 
        section: 1.2, article: 1.3,
        header: 1.1, main: 1.2, 
        aside: 0.8, footer: 0.7,
        nav: 0.6,
        ...config?.contextMultipliers 
      },
      depthDecay: config?.depthDecay ?? 1.05,
      maxDepth: config?.maxDepth ?? 10,
      minTextLength: config?.minTextLength ?? 3,
    };
  }

  extractMeta($: any): Section[] {
    const sections: Section[] = [];
    const metaTags = $('meta');
    metaTags.each((_: any, element: any) => {
      const $element = $(element);
      const nameAttr: string = $element.attr('name') || $element.attr('property') || $element.attr('http-equiv') || '';
      const contentAttr: string = $element.attr('content') || '';

      const metaMap: Record<string, { name: string; weight: number } | null> = {
        description: { name: 'description', weight: 20 },
        keywords: { name: 'keywords', weight: 200 },
        'og:title': { name: 'title', weight: 200 },
        'og:description': { name: 'description', weight: 20 },
        'og:type': { name: 'type', weight: 1 },
        'og:url': { name: 'url', weight: 2000 },
        'og:image': { name: 'image', weight: 1 },
        author: { name: 'author', weight: 10 },
        'article:published_time': { name: 'published_time', weight: 10 },
      };

      if (metaMap[nameAttr] && contentAttr) {
        const section: Section = {
          type: 'meta',
          content: contentAttr.trim(),
          weight: metaMap[nameAttr].weight,
          meta: {
            term: metaMap[nameAttr].name
          }
        }
        sections.push(section);
      }
    });

    return sections;
  }

  extract(html: string): Section[] {
    const sections: Section[] = [];
    try {
      const $ = cheerio.load(html);

      sections.push(...this.extractMeta($));
      // Remove script, style, and other non-content elements
      $('script, style, noscript, meta, link').remove();
      
      // Extract sections from body or root if no body
      const root = $('body').length > 0 ? $('body') : $.root();
      
      const extractedSections = this.extractSectionsRecursively($, root, [], 0);
      
      // Convert to Section objects and filter by minimum length
      for (const extracted of extractedSections) {
        if (extracted.content.length >= this.config.minTextLength!) {
          const section = new Section();
          section.type = extracted.type;
          section.content = extracted.content;
          section.weight = extracted.weight;
          section.meta = {
            depth: extracted.depth.toString(),
            context: extracted.context.join(' > '),
            ...extracted.meta
          };
          sections.push(section);
        }
      }

    } catch (error) {
      console.error('HTMLExtractor error:', error);
      return [];
    }
    
    return sections;
  }

  private extractSectionsRecursively(
    $: any,
    element: any, 
    contextPath: string[], 
    depth: number
  ): ExtractedSection[] {
    const sections: ExtractedSection[] = [];
    
    if (depth > this.config.maxDepth!) {
      return sections;
    }

    element.children().each((_: any, child: any) => {
      const $child = $(child);
      const tagName = child.type === 'tag' ? child.name.toLowerCase() : '';
      
      if (child.type === 'text') {
        const text = $child.text().trim();
        if (text.length >= this.config.minTextLength!) {
          sections.push(this.createSection('text', text, contextPath, depth));
        }
        return;
      }
      
      if (child.type !== 'tag') return;

      const newContextPath = [...contextPath, tagName];
      
      // Check if this is a content-bearing element
      if (this.isContentElement(tagName)) {
        const text = this.extractDirectText($, $child);
        
        if (text.length >= this.config.minTextLength!) {
          const section = this.createSection(tagName, text, contextPath, depth, $child);
          sections.push(section);
        }
      }
      
      // Recursively process children for container elements
      if (this.isContainerElement(tagName)) {
        const childSections = this.extractSectionsRecursively($, $child, newContextPath, depth + 1);
        sections.push(...childSections);
      }
    });

    return sections;
  }

  private createSection(
    type: string, 
    content: string, 
    contextPath: string[], 
    depth: number, 
    element?: any
  ): ExtractedSection {
    const baseWeight = this.config.baseWeights[type] ?? 1;
    let weight = baseWeight;

    // Apply depth decay
    weight = weight / Math.pow(this.config.depthDecay, depth);

    // Apply context multipliers
    for (const context of contextPath) {
      const multiplier = this.config.contextMultipliers[context];
      if (multiplier) {
        weight *= multiplier;
      }
    }

    // Apply inline multipliers if element is provided
    if (element) {
      weight *= this.calculateInlineMultipliers(element);
    }

    const section: ExtractedSection = {
      type,
      content: content.trim(),
      weight: Math.round(weight * 100) / 100, // Round to 2 decimal places
      depth,
      context: contextPath,
    };

    // Add additional metadata for certain elements
    if (element && type.startsWith('h')) {
      section.meta = {
        level: type,
        id: element.attr('id') || '',
        classes: element.attr('class') || ''
      };
    }

    return section;
  }

  private extractDirectText($: any, element: any): string {
    // Get text content, preserving some structure
    let text = '';
    
    element.contents().each((_: any, node: any) => {
      if (node.type === 'text') {
        text += $(node).text();
      } else if (node.type === 'tag') {
        const tagName = node.name.toLowerCase();
        if (this.isInlineElement(tagName)) {
          text += $(node).text();
        } else {
          text += ' '; // Add space for block elements
        }
      }
    });

    return text.replace(/\s+/g, ' ').trim();
  }

  private calculateInlineMultipliers(element: any): number {
    let multiplier = 1;
    
    // Check for inline emphasis elements within this element
    const inlineElements = element.find(Object.keys(this.config.inlineMultipliers).join(','));
    
    inlineElements.each((_: any, inlineEl: any) => {
      const tagName = inlineEl.type === 'tag' ? inlineEl.name.toLowerCase() : '';
      const inlineMultiplier = this.config.inlineMultipliers[tagName];
      if (inlineMultiplier) {
        multiplier *= inlineMultiplier;
      }
    });

    return multiplier;
  }

  private isContentElement(tagName: string): boolean {
    const contentElements = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'blockquote', 'pre', 'code',
      'li', 'dt', 'dd', 'td', 'th',
      'figcaption', 'caption'
    ];
    return contentElements.includes(tagName);
  }

  private isContainerElement(tagName: string): boolean {
    const containerElements = [
      'div', 'section', 'article', 'aside', 'nav', 'header', 'footer', 'main',
      'ul', 'ol', 'dl', 'table', 'tbody', 'thead', 'tr',
      'figure', 'details', 'summary'
    ];
    return containerElements.includes(tagName);
  }

  private isInlineElement(tagName: string): boolean {
    const inlineElements = [
      'span', 'a', 'b', 'strong', 'i', 'em', 'u', 'mark',
      'code', 'kbd', 'samp', 'var', 'sub', 'sup', 'small'
    ];
    return inlineElements.includes(tagName);
  }
}
