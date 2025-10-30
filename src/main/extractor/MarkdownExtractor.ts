// import probe from 'probe-image-size';
import markdownit from 'markdown-it';
import { dl } from '@mdit/plugin-dl';
import { full as emoji } from 'markdown-it-emoji';
import { Section } from '../indexer/Indexable';

export class MarkdownRenderer {
  private md: markdownit;

  constructor() {
    this.md = markdownit({ html: true, linkify: true, typographer: true })
      .use(dl)
      .use(emoji);
  }

  render(markdown: string): Section[] {
    this.md.render(markdown);
    return [];
  }
}
