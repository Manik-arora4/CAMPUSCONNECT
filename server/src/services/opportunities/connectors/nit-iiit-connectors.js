/**
 * NIT and IIIT connectors.
 * Scrapes career/placement portals of major NITs and IIITs.
 */

import { BaseConnector } from './base.js';

// ─── Generic NIT Connector ───
export class NITConnector extends BaseConnector {
  /**
   * @param {Object} config
   * @param {string} config.nitName - e.g., 'NIT Trichy'
   * @param {string} config.code - e.g., 'NITT'
   * @param {string} config.baseUrl - e.g., 'https://www.nitt.edu'
   * @param {string[]} [config.paths] - paths to scrape
   */
  constructor(config) {
    super({
      id: `nit-${config.code?.toLowerCase() || config.nitName.toLowerCase().replace(/\s+/g, '-')}`,
      name: `${config.nitName} Career Portal`,
      source: config.nitName,
      type: 'scraper',
      baseUrl: config.baseUrl,
    });
    this.nitPaths = config.paths || ['/placements', '/career'];
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching ${this.source} opportunities`);
    const items = [];

    for (const p of this.nitPaths) {
      const url = `${this.baseUrl}${p}`;
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();

      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|hack|research|fellow|scholar|train|placement|recruit)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith('http') ? href : new URL(href, this.baseUrl).href;
        items.push({
          title: cleanTitle,
          organization: this.source,
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from ${this.source}: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: this.source,
          mode: 'onsite',
          deadline: null,
          skillsRequired: [],
          stipend: '',
          prize: '',
          tags: ['nit', this.source.toLowerCase().replace(/\s+/g, '-'), 'career'],
          externalId: this.generateExternalId(cleanTitle, this.source),
          eligibility: `${this.source} students and eligible external candidates`,
          requirements: [],
        });
      }
      await this.delay();
    }

    console.log(`[connector:${this.id}] Found ${items.length} ${this.source} opportunities`);
    return items;
  }
}

// ─── IIIT Connector ───
export class IIITConnector extends BaseConnector {
  constructor(config) {
    super({
      id: `iiit-${config.code?.toLowerCase() || config.iiitName.toLowerCase().replace(/\s+/g, '-')}`,
      name: `${config.iiitName} Career Portal`,
      source: config.iiitName,
      type: 'scraper',
      baseUrl: config.baseUrl,
    });
    this.iiitPaths = config.paths || ['/placements', '/career'];
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching ${this.source} opportunities`);
    const items = [];

    for (const p of this.iiitPaths) {
      const url = `${this.baseUrl}${p}`;
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();

      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|hack|research|fellow|scholar|train|placement|recruit)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith('http') ? href : new URL(href, this.baseUrl).href;
        items.push({
          title: cleanTitle,
          organization: this.source,
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from ${this.source}: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: this.source,
          mode: 'onsite',
          deadline: null,
          skillsRequired: [],
          stipend: '',
          prize: '',
          tags: ['iiit', this.source.toLowerCase().replace(/\s+/g, '-'), 'career'],
          externalId: this.generateExternalId(cleanTitle, this.source),
          eligibility: `${this.source} students and eligible external candidates`,
          requirements: [],
        });
      }
      await this.delay();
    }

    console.log(`[connector:${this.id}] Found ${items.length} ${this.source} opportunities`);
    return items;
  }
}

// Pre-built NIT instances
export const NIT_TRICHY = new NITConnector({
  nitName: 'NIT Trichy', code: 'NITT',
  baseUrl: 'https://www.nitt.edu',
  paths: ['/placements', '/career'],
});

export const NIT_WARANGAL = new NITConnector({
  nitName: 'NIT Warangal', code: 'NITW',
  baseUrl: 'https://www.nitw.ac.in',
  paths: ['/placements', '/crc'],
});

export const NIT_CALICUT = new NITConnector({
  nitName: 'NIT Calicut', code: 'NITC',
  baseUrl: 'https://www.nitc.ac.in',
  paths: ['/placements', '/career'],
});

export const NIT_SURATHKAL = new NITConnector({
  nitName: 'NIT Surathkal', code: 'NITK',
  baseUrl: 'https://www.nitk.ac.in',
  paths: ['/placements', '/crc'],
});

export const NIT_ROURKELA = new NITConnector({
  nitName: 'NIT Rourkela', code: 'NITR',
  baseUrl: 'https://www.nitrkl.ac.in',
  paths: ['/placements', '/crc'],
});

// Pre-built IIIT instances
export const IIIT_HYDERABAD = new IIITConnector({
  iiitName: 'IIIT Hyderabad', code: 'IIITH',
  baseUrl: 'https://www.iiit.ac.in',
  paths: ['/placements', '/career'],
});

export const IIIT_ALLAHABAD = new IIITConnector({
  iiitName: 'IIIT Allahabad', code: 'IIITA',
  baseUrl: 'https://www.iiita.ac.in',
  paths: ['/placements', '/career'],
});

export const IIIT_BANGALORE = new IIITConnector({
  iiitName: 'IIIT Bangalore', code: 'IIITB',
  baseUrl: 'https://www.iiitb.ac.in',
  paths: ['/placements', '/career'],
});

export const IIIT_DELHI = new IIITConnector({
  iiitName: 'IIIT Delhi', code: 'IIITD',
  baseUrl: 'https://www.iiitd.ac.in',
  paths: ['/placements', '/career'],
});

export const IIIT_DHARWAD = new IIITConnector({
  iiitName: 'IIIT Dharwad', code: 'IIITDHD',
  baseUrl: 'https://www.iiitdwd.ac.in',
  paths: ['/placements', '/career'],
});

export const IIIT_RANCHI = new IIITConnector({
  iiitName: 'IIIT Ranchi', code: 'IIITR',
  baseUrl: 'https://www.iiitranchi.ac.in',
  paths: ['/placements', '/career'],
});
