/**
 * Web scraper connector.
 * Fetches HTML pages and extracts opportunities using CSS-like selectors.
 * Used for university career pages without RSS feeds.
 */

import { BaseConnector } from './base.js';

export class ScraperConnector extends BaseConnector {
  /**
   * @param {Object} config
   * @param {string} config.url - URL to scrape
   * @param {string} config.listSelector - regex pattern to match opportunity blocks
   * @param {Object} config.fields - { title, link, description, deadline } - each is a regex capture group
   * @param {Function} [config.mapItem] - custom mapping function
   */
  constructor(config) {
    super({ ...config, type: 'scraper' });
    this.url = config.url;
    this.listPattern = config.listPattern;
    this.fieldPatterns = config.fields;
    this.mapItem = config.mapItem;
  }

  async fetch() {
    console.log(`[connector:${this.id}] Scraping: ${this.url}`);
    const res = await this.safeFetch(this.url);
    if (!res || !res.ok) {
      console.warn(`[connector:${this.id}] Scrape failed: ${res?.status}`);
      return [];
    }

    const html = await res.text();
    const items = this.parseHTML(html);
    console.log(`[connector:${this.id}] Extracted ${items.length} items`);
    return items;
  }

  parseHTML(html) {
    // Extract list blocks
    let blocks = [html];
    if (this.listPattern) {
      const regex = new RegExp(this.listPattern, 'gis');
      blocks = (html.match(regex) || []);
    }

    const items = [];
    for (const block of blocks) {
      const item = this.extractFields(block);
      if (item && item.title) items.push(item);
    }

    if (this.mapItem) {
      return items.map((item) => this.mapItem(item, this)).filter(Boolean);
    }
    return items;
  }

  extractFields(html) {
    const extract = (pattern) => {
      if (!pattern) return '';
      const regex = new RegExp(pattern, 'is');
      const match = html.match(regex);
      return (match?.[1] || '').trim();
    };

    const title = this.stripHTML(extract(this.fieldPatterns?.title));
    if (!title) return null;

    const link = extract(this.fieldPatterns?.link);
    const description = this.stripHTML(extract(this.fieldPatterns?.description));
    const deadlineRaw = extract(this.fieldPatterns?.deadline);

    return {
      title,
      description: description?.slice(0, 2000) || '',
      sourceUrl: link ? this.resolveUrl(link) : this.url,
      applyUrl: link ? this.resolveUrl(link) : this.url,
      deadline: this.parseDeadline(deadlineRaw) || null,
      category: this.parseCategory(title + ' ' + description),
      organization: this.source,
      location: 'India',
      mode: 'onsite',
      skillsRequired: [],
      stipend: '',
      prize: '',
      tags: [],
      externalId: this.generateExternalId(title, this.source),
      eligibility: '',
      requirements: [],
    };
  }

  resolveUrl(href) {
    if (href.startsWith('http')) return href;
    try {
      return new URL(href, this.baseUrl || this.url).href;
    } catch {
      return href;
    }
  }

  stripHTML(html) {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  }
}
