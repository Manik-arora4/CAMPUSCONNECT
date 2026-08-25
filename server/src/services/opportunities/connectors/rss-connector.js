/**
 * Generic RSS/Atom feed connector.
 * Parses RSS/Atom feeds into NormalizedOpp[].
 * Used for career portals, job boards, and announcement feeds.
 */

import { BaseConnector } from './base.js';

export class RSSConnector extends BaseConnector {
  /**
   * @param {Object} config
   * @param {string} config.feedUrl - URL of the RSS/Atom feed
   * @param {Function} [config.mapItem] - custom mapping function from feed item to NormalizedOpp
   */
  constructor(config) {
    super({ ...config, type: 'rss' });
    this.feedUrl = config.feedUrl;
    this.mapItem = config.mapItem;
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching RSS feed: ${this.feedUrl}`);
    const res = await this.safeFetch(this.feedUrl);
    if (!res || !res.ok) {
      console.warn(`[connector:${this.id}] Feed fetch failed: ${res?.status}`);
      return [];
    }

    const xml = await res.text();
    const items = this.parseFeed(xml);
    console.log(`[connector:${this.id}] Parsed ${items.length} items from feed`);
    return items;
  }

  parseFeed(xml) {
    const items = [];

    // Try RSS format first (item tags)
    const rssMatches = xml.match(/<item[^>]*>([\s\S]*?)<\/item>/gi) || [];
    for (const match of rssMatches) {
      const item = this.parseXMLItem(match, 'rss');
      if (item) items.push(item);
    }

    // Try Atom format (entry tags)
    if (items.length === 0) {
      const atomMatches = xml.match(/<entry[^>]*>([\s\S]*?)<\/entry>/gi) || [];
      for (const match of atomMatches) {
        const item = this.parseXMLItem(match, 'atom');
        if (item) items.push(item);
      }
    }

    // Apply custom mapper if provided
    if (this.mapItem) {
      return items.map((item) => this.mapItem(item, this)).filter(Boolean);
    }

    return items;
  }

  parseXMLItem(xml, format) {
    const getField = (tag) => {
      const regex = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
      const match = xml.match(regex);
      if (!match) return '';
      return (match[1] || match[2] || '').trim();
    };

    const title = getField('title');
    if (!title) return null;

    const link = getField('link') || getField('url');
    const description = getField('description') || getField('summary') || getField('content');
    const pubDate = getField('pubDate') || getField('published') || getField('updated') || getField('dc:date');
    const category = getField('category');

    return {
      title,
      description: this.stripHTML(description),
      sourceUrl: link,
      deadline: this.parseDeadline(pubDate) || null,
      category: this.parseCategory(category),
      postedDate: pubDate,
      organization: this.source,
      location: 'India',
      mode: 'remote',
      skillsRequired: [],
      stipend: '',
      prize: '',
      tags: [],
      externalId: this.generateExternalId(title, this.source),
      eligibility: '',
      requirements: [],
      applyUrl: link,
    };
  }

  stripHTML(html) {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000);
  }
}
