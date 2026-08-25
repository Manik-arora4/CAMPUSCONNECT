/**
 * IIT-specific connectors.
 * Each IIT has its own career/placement portal.
 * We scrape or RSS-parse their public pages.
 */

import { BaseConnector } from './base.js';
import { RSSConnector } from './rss-connector.js';
import { ScraperConnector } from './scraper-connector.js';

// ─── IIT Delhi ───
export class IITDelhiConnector extends BaseConnector {
  constructor() {
    super({
      id: 'iit-delhi',
      name: 'IIT Delhi Career Portal',
      source: 'IIT Delhi',
      type: 'scraper',
      baseUrl: 'https://home.iitd.ac.in',
    });
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching IIT Delhi opportunities`);
    const items = [];

    // Scrape placement/career pages
    const urls = [
      'https://home.iitd.ac.in/placement',
      'https://careerdev.iitd.ac.in/',
    ];

    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();

      // Extract links and headings that look like opportunities
      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|hack|research|fellow|scholar|train)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith('http') ? href : `https://home.iitd.ac.in${href}`;
        items.push(this.normalize(cleanTitle, fullUrl, 'IIT Delhi'));
      }

      // Extract from broader link patterns
      const broadPattern = /<a[^>]*href="([^"]*)"[^>]*class="[^"]*(?:list|card|item|opp)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
      while ((match = broadPattern.exec(html)) !== null) {
        const [, href, content] = match;
        const text = this.stripHTML(content).trim();
        if (text.length > 10 && text.length < 200) {
          const fullUrl = href.startsWith('http') ? href : `https://home.iitd.ac.in${href}`;
          items.push(this.normalize(text, fullUrl, 'IIT Delhi'));
        }
      }
      await this.delay();
    }

    console.log(`[connector:${this.id}] Found ${items.length} IIT Delhi opportunities`);
    return items;
  }

  normalize(title, url, org) {
    return {
      title,
      organization: org,
      category: this.parseCategory(title),
      description: `Opportunity from ${org}: ${title}`,
      sourceUrl: url,
      applyUrl: url,
      location: 'New Delhi, India',
      mode: 'onsite',
      deadline: null,
      skillsRequired: [],
      stipend: '',
      prize: '',
      tags: ['iit', 'iit-delhi', 'career'],
      externalId: this.generateExternalId(title, org),
      eligibility: 'IIT Delhi students and eligible external candidates',
      requirements: [],
    };
  }

  stripHTML(html) {
    return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  }
}

// ─── IIT Madras ───
export class IITMadrasConnector extends BaseConnector {
  constructor() {
    super({
      id: 'iit-madras',
      name: 'IIT Madras Career Cell',
      source: 'IIT Madras',
      type: 'scraper',
      baseUrl: 'https://www.iitm.ac.in',
    });
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching IIT Madras opportunities`);
    const items = [];

    const urls = [
      'https://www.iitm.ac.in/placements',
      'https://www.cse.iitm.ac.in/opportunities',
      'https://dfrl.iitm.ac.in/opportunities.html',
    ];

    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();

      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|hack|research|fellow|scholar|train|workshop)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
        items.push({
          title: cleanTitle,
          organization: 'IIT Madras',
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from IIT Madras: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: 'Chennai, India',
          mode: 'onsite',
          deadline: null,
          skillsRequired: [],
          stipend: '',
          prize: '',
          tags: ['iit', 'iit-madras', 'career'],
          externalId: this.generateExternalId(cleanTitle, 'IIT Madras'),
          eligibility: 'IIT Madras students and eligible external candidates',
          requirements: [],
        });
      }
      await this.delay();
    }

    console.log(`[connector:${this.id}] Found ${items.length} IIT Madras opportunities`);
    return items;
  }
}

// ─── IIT Roorkee ───
export class IITRoorkeeConnector extends BaseConnector {
  constructor() {
    super({
      id: 'iit-roorkee',
      name: 'IIT Roorkee Placement Cell',
      source: 'IIT Roorkee',
      type: 'scraper',
      baseUrl: 'https://www.iitr.ac.in',
    });
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching IIT Roorkee opportunities`);
    const items = [];

    const urls = [
      'https://www.iitr.ac.in/placement',
      'https://crc.iitr.ac.in/',
    ];

    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();

      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|hack|research|fellow|scholar|train)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
        items.push({
          title: cleanTitle,
          organization: 'IIT Roorkee',
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from IIT Roorkee: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: 'Roorkee, Uttarakhand, India',
          mode: 'onsite',
          deadline: null,
          skillsRequired: [],
          stipend: '',
          prize: '',
          tags: ['iit', 'iit-roorkee', 'career'],
          externalId: this.generateExternalId(cleanTitle, 'IIT Roorkee'),
          eligibility: 'IIT Roorkee students and eligible external candidates',
          requirements: [],
        });
      }
      await this.delay();
    }

    console.log(`[connector:${this.id}] Found ${items.length} IIT Roorkee opportunities`);
    return items;
  }
}

// ─── IIT Bombay ───
export class IITBombayConnector extends BaseConnector {
  constructor() {
    super({
      id: 'iit-bombay',
      name: 'IIT Bombay Career Cell',
      source: 'IIT Bombay',
      type: 'scraper',
      baseUrl: 'https://www.iitb.ac.in',
    });
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching IIT Bombay opportunities`);
    const items = [];

    const urls = [
      'https://www.iitb.ac.in/placements',
      'https://cc.iitb.ac.in/',
    ];

    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();

      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|hack|research|fellow|scholar|train)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
        items.push({
          title: cleanTitle,
          organization: 'IIT Bombay',
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from IIT Bombay: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: 'Mumbai, Maharashtra, India',
          mode: 'onsite',
          deadline: null,
          skillsRequired: [],
          stipend: '',
          prize: '',
          tags: ['iit', 'iit-bombay', 'career'],
          externalId: this.generateExternalId(cleanTitle, 'IIT Bombay'),
          eligibility: 'IIT Bombay students and eligible external candidates',
          requirements: [],
        });
      }
      await this.delay();
    }

    console.log(`[connector:${this.id}] Found ${items.length} IIT Bombay opportunities`);
    return items;
  }
}

// ─── IIT Kanpur ───
export class IITKanpurConnector extends BaseConnector {
  constructor() {
    super({
      id: 'iit-kanpur',
      name: 'IIT Kanpur Career Cell',
      source: 'IIT Kanpur',
      type: 'scraper',
      baseUrl: 'https://www.iitk.ac.in',
    });
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching IIT Kanpur opportunities`);
    const items = [];

    const urls = [
      'https://www.iitk.ac.in/career',
      'https://www.iitk.ac.in/careerdev',
    ];

    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();

      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|hack|research|fellow|scholar|train)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
        items.push({
          title: cleanTitle,
          organization: 'IIT Kanpur',
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from IIT Kanpur: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: 'Kanpur, UP, India',
          mode: 'onsite',
          deadline: null,
          skillsRequired: [],
          stipend: '',
          prize: '',
          tags: ['iit', 'iit-kanpur', 'career'],
          externalId: this.generateExternalId(cleanTitle, 'IIT Kanpur'),
          eligibility: 'IIT Kanpur students and eligible external candidates',
          requirements: [],
        });
      }
      await this.delay();
    }

    console.log(`[connector:${this.id}] Found ${items.length} IIT Kanpur opportunities`);
    return items;
  }
}

// ─── IIT Kharagpur ───
export class IITKharagpurConnector extends BaseConnector {
  constructor() {
    super({
      id: 'iit-kharagpur',
      name: 'IIT Kharagpur Career Cell',
      source: 'IIT Kharagpur',
      type: 'scraper',
      baseUrl: 'https://www.iitkgp.ac.in',
    });
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching IIT Kharagpur opportunities`);
    const items = [];

    const urls = [
      'https://www.iitkgp.ac.in/placement',
      'https://www.iitkgp.ac.in/career',
    ];

    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();

      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|hack|research|fellow|scholar|train)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
        items.push({
          title: cleanTitle,
          organization: 'IIT Kharagpur',
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from IIT Kharagpur: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: 'Kharagpur, West Bengal, India',
          mode: 'onsite',
          deadline: null,
          skillsRequired: [],
          stipend: '',
          prize: '',
          tags: ['iit', 'iit-kharagpur', 'career'],
          externalId: this.generateExternalId(cleanTitle, 'IIT Kharagpur'),
          eligibility: 'IIT Kharagpur students and eligible external candidates',
          requirements: [],
        });
      }
      await this.delay();
    }

    console.log(`[connector:${this.id}] Found ${items.length} IIT Kharagpur opportunities`);
    return items;
  }
}

// ─── IIT Hyderabad ───
export class IITHyderabadConnector extends BaseConnector {
  constructor() {
    super({
      id: 'iit-hyderabad',
      name: 'IIT Hyderabad Career Cell',
      source: 'IIT Hyderabad',
      type: 'scraper',
      baseUrl: 'https://www.iith.ac.in',
    });
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching IIT Hyderabad opportunities`);
    const items = [];

    const urls = [
      'https://www.iith.ac.in/placements',
      'https://www.iith.ac.in/career',
    ];

    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();

      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|hack|research|fellow|scholar|train)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
        items.push({
          title: cleanTitle,
          organization: 'IIT Hyderabad',
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from IIT Hyderabad: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: 'Hyderabad, Telangana, India',
          mode: 'onsite',
          deadline: null,
          skillsRequired: [],
          stipend: '',
          prize: '',
          tags: ['iit', 'iit-hyderabad', 'career'],
          externalId: this.generateExternalId(cleanTitle, 'IIT Hyderabad'),
          eligibility: 'IIT Hyderabad students and eligible external candidates',
          requirements: [],
        });
      }
      await this.delay();
    }

    console.log(`[connector:${this.id}] Found ${items.length} IIT Hyderabad opportunities`);
    return items;
  }
}

// ─── IIT Guwahati ───
export class IITGuwahatiConnector extends BaseConnector {
  constructor() {
    super({
      id: 'iit-guwahati',
      name: 'IIT Guwahati Career Cell',
      source: 'IIT Guwahati',
      type: 'scraper',
      baseUrl: 'https://www.iitg.ac.in',
    });
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching IIT Guwahati opportunities`);
    const items = [];

    const urls = [
      'https://www.iitg.ac.in/placements',
      'https://www.iitg.ac.in/career',
    ];

    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();

      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|hack|research|fellow|scholar|train)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
        items.push({
          title: cleanTitle,
          organization: 'IIT Guwahati',
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from IIT Guwahati: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: 'Guwahati, Assam, India',
          mode: 'onsite',
          deadline: null,
          skillsRequired: [],
          stipend: '',
          prize: '',
          tags: ['iit', 'iit-guwahati', 'career'],
          externalId: this.generateExternalId(cleanTitle, 'IIT Guwahati'),
          eligibility: 'IIT Guwahati students and eligible external candidates',
          requirements: [],
        });
      }
      await this.delay();
    }

    console.log(`[connector:${this.id}] Found ${items.length} IIT Guwahati opportunities`);
    return items;
  }
}
