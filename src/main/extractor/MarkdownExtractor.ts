// import probe from 'probe-image-size';
import markdownit from 'markdown-it';
import { dl } from '@mdit/plugin-dl';
import { full as emoji } from 'markdown-it-emoji';
import { Section } from '../indexer/Indexable';

export class MarkdownExtractor {
  private md: markdownit;

  constructor() {
    this.md = markdownit({ html: true, linkify: true, typographer: true })
      .use(dl)
      .use(emoji);
  }

  async extract(markdown: string): Promise<Section[]> {
    const result = this.md.render(markdown);
    // Ooh forgot I need to parse the HTML into sections
    return [];
  }
}
