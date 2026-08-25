/**
 * Third-party platform connectors.
 * Internshala, government portals, scholarship platforms, etc.
 */

import { BaseConnector } from './base.js';

// ─── Internshala (RSS feed) ───
export class InternshalaConnector extends BaseConnector {
  constructor() {
    super({
      id: 'internshala',
      name: 'Internshala',
      source: 'Internshala',
      type: 'rss',
      baseUrl: 'https://internshala.com',
    });
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching Internshala opportunities`);
    const items = [];

    // Fetch multiple category pages
    const categories = [
      { url: 'https://internshala.com/internships', type: 'internship' },
      { url: 'https://internshala.com/jobs', type: 'job' },
    ];

    for (const cat of categories) {
      const res = await this.safeFetch(cat.url);
      if (!res || !res.ok) continue;
      const html = await res.text();

      // Parse internship/job cards from Internshala HTML
      const cardPattern = /<div[^>]*class="[^"]*individual_internship[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
      let match;
      while ((match = cardPattern.exec(html)) !== null) {
        const block = match[1];
        const titleMatch = block.match(/<a[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
        const companyMatch = block.match(/<p[^>]*class="[^"]*company[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
        const locationMatch = block.match(/<p[^>]*class="[^"]*location[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
        const stipendMatch = block.match(/<span[^>]*class="[^"]*stipend[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const linkMatch = block.match(/<a[^>]*href="([^"]*)"[^>]*class="[^"]*title[^"]*"/i);

        const title = this.stripHTML(titleMatch?.[1] || '').trim();
        if (!title || title.length < 5) continue;

        const company = this.stripHTML(companyMatch?.[1] || '').trim() || 'Various Companies';
        const location = this.stripHTML(locationMatch?.[1] || '').trim() || 'India';
        const stipend = this.stripHTML(stipendMatch?.[1] || '').trim();
        const href = linkMatch?.[1] || '';
        const fullUrl = href.startsWith('http') ? href : `https://internshala.com${href}`;

        items.push({
          title,
          organization: company,
          category: cat.type,
          description: `${title} at ${company} via Internshala`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location,
          mode: /remote|work from home|wfh/i.test(location) ? 'remote' : 'onsite',
          deadline: null,
          skillsRequired: [],
          stipend,
          prize: '',
          tags: ['internshala', cat.type],
          externalId: this.generateExternalId(title, company),
          eligibility: 'Open to all students',
          requirements: [],
        });
      }
      await this.delay();
    }

    console.log(`[connector:${this.id}] Found ${items.length} Internshala opportunities`);
    return items;
  }

  stripHTML(html) {
    return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8211;/g, '-').replace(/\s+/g, ' ').trim();
  }
}

// ─── Government Scholarship Portal ───
export class GovScholarshipConnector extends BaseConnector {
  constructor() {
    super({
      id: 'gov-scholarships',
      name: 'Government Scholarships Portal',
      source: 'Government of India',
      type: 'scraper',
      baseUrl: 'https://scholarships.gov.in',
    });
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching government scholarships`);
    const items = [];

    const urls = [
      'https://scholarships.gov.in/public/nssh/STUDENT/SchemeDetails',
      'https://www.myscheme.gov.in/search/scholarship',
    ];

    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();

      // Extract scholarship cards
      const cardPattern = /<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
      let match;
      while ((match = cardPattern.exec(html)) !== null) {
        const [, href, titleRaw] = match;
        const title = this.stripHTML(titleRaw).trim();
        if (!title || title.length < 5 || /login|register|sign/i.test(title)) continue;

        const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
        items.push({
          title,
          organization: 'Government of India',
          category: 'scholarship',
          description: `Government scholarship: ${title}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: 'India',
          mode: 'remote',
          deadline: null,
          skillsRequired: [],
          stipend: '',
          prize: '',
          tags: ['government', 'scholarship', 'india'],
          externalId: this.generateExternalId(title, 'Government of India'),
          eligibility: 'Indian students as per scheme eligibility',
          requirements: [],
        });
      }
      await this.delay();
    }

    console.log(`[connector:${this.id}] Found ${items.length} government scholarships`);
    return items;
  }

  stripHTML(html) {
    return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  }
}

// ─── MyGov Innovation Challenge ───
export class MyGovConnector extends BaseConnector {
  constructor() {
    super({
      id: 'mygov',
      name: 'MyGov Innovation Challenges',
      source: 'MyGov India',
      type: 'scraper',
      baseUrl: 'https://www.mygov.in',
    });
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching MyGov challenges`);
    const items = [];

    const urls = [
      'https://www.mygov.in/challenge',
      'https://innovate.mygov.in/',
    ];

    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();

      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:challenge|hack|innovat|compet|contest)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith('http') ? href : `https://www.mygov.in${href}`;
        items.push({
          title: cleanTitle,
          organization: 'MyGov India',
          category: this.parseCategory(cleanTitle),
          description: `Government innovation challenge: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: 'India',
          mode: 'remote',
          deadline: null,
          skillsRequired: [],
          stipend: '',
          prize: '',
          tags: ['mygov', 'government', 'innovation'],
          externalId: this.generateExternalId(cleanTitle, 'MyGov India'),
          eligibility: 'Indian citizens, students welcome',
          requirements: [],
        });
      }
      await this.delay();
    }

    console.log(`[connector:${this.id}] Found ${items.length} MyGov challenges`);
    return items;
  }
}

// ─── Kaggle Competitions ───
export class KaggleConnector extends BaseConnector {
  constructor() {
    super({
      id: 'kaggle',
      name: 'Kaggle Competitions',
      source: 'Kaggle',
      type: 'api',
      baseUrl: 'https://www.kaggle.com',
    });
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching Kaggle competitions`);
    const items = [];

    // Kaggle public API for competitions
    const res = await this.safeFetch('https://www.kaggle.com/api/v1/competitions/list?sortBy=recentlyCreated&page=1');
    if (res && res.ok) {
      try {
        const data = await res.json();
        for (const comp of (data || [])) {
          const title = comp.title || comp.name;
          if (!title) continue;
          items.push({
            title,
            organization: 'Kaggle',
            category: 'competition',
            description: comp.description || `${title} - Kaggle competition`,
            sourceUrl: `https://www.kaggle.com/competitions/${comp.ref}`,
            applyUrl: `https://www.kaggle.com/competitions/${comp.ref}`,
            location: 'Online',
            mode: 'remote',
            deadline: comp.deadline || null,
            skillsRequired: comp.tags || [],
            stipend: '',
            prize: comp.reward || '',
            tags: ['kaggle', 'data-science', 'ml', 'competition'],
            externalId: comp.ref || this.generateExternalId(title, 'Kaggle'),
            eligibility: 'Open to all',
            requirements: [],
          });
        }
      } catch (err) {
        console.warn(`[connector:${this.id}] Failed to parse Kaggle API: ${err.message}`);
      }
    }

    // Fallback: scrape the competitions page
    if (items.length === 0) {
      const html = await this.safeFetch('https://www.kaggle.com/competitions');
      if (html && html.ok) {
        const text = await html.text();
        const cardPattern = /<a[^>]*href="\/competitions\/([^"]*)"[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/gi;
        let match;
        while ((match = cardPattern.exec(text)) !== null) {
          const [, ref, title] = match;
          const cleanTitle = this.stripHTML(title).trim();
          if (!cleanTitle || cleanTitle.length < 3) continue;
          items.push({
            title: cleanTitle,
            organization: 'Kaggle',
            category: 'competition',
            description: `${cleanTitle} - Kaggle competition`,
            sourceUrl: `https://www.kaggle.com/competitions/${ref}`,
            applyUrl: `https://www.kaggle.com/competitions/${ref}`,
            location: 'Online',
            mode: 'remote',
            deadline: null,
            skillsRequired: [],
            stipend: '',
            prize: '',
            tags: ['kaggle', 'competition'],
            externalId: ref,
            eligibility: 'Open to all',
            requirements: [],
          });
        }
      }
    }

    console.log(`[connector:${this.id}] Found ${items.length} Kaggle competitions`);
    return items;
  }

  stripHTML(html) {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

// ─── Google for Education ───
export class GoogleEducationConnector extends BaseConnector {
  constructor() {
    super({
      id: 'google-education',
      name: 'Google for Education',
      source: 'Google',
      type: 'scraper',
      baseUrl: 'https://edu.google.com',
    });
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching Google Education opportunities`);
    const items = [];

    const urls = [
      'https://buildyourfuture.withgoogle.com/programs',
      'https://edu.google.com/intl/ALL_in/programs/',
    ];

    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();

      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:scholar|fellow|intern|train|program|hack)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
        items.push({
          title: cleanTitle,
          organization: 'Google',
          category: this.parseCategory(cleanTitle),
          description: `Google education program: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: 'India',
          mode: 'hybrid',
          deadline: null,
          skillsRequired: [],
          stipend: '',
          prize: '',
          tags: ['google', 'education', 'tech'],
          externalId: this.generateExternalId(cleanTitle, 'Google'),
          eligibility: 'Students enrolled in degree programs',
          requirements: [],
        });
      }
      await this.delay();
    }

    console.log(`[connector:${this.id}] Found ${items.length} Google Education opportunities`);
    return items;
  }
}

// ─── AngelList / Wellfound Startups ───
export class WellfoundConnector extends BaseConnector {
  constructor() {
    super({
      id: 'wellfound',
      name: 'Wellfound (AngelList)',
      source: 'Wellfound',
      type: 'scraper',
      baseUrl: 'https://wellfound.com',
    });
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching Wellfound opportunities`);
    const items = [];

    const res = await this.safeFetch('https://wellfound.com/internships');
    if (res && res.ok) {
      const html = await res.text();

      const cardPattern = /<div[^>]*class="[^"]*job[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
      let match;
      while ((match = cardPattern.exec(html)) !== null) {
        const block = match[1];
        const titleMatch = block.match(/<span[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const companyMatch = block.match(/<span[^>]*class="[^"]*company[^"]*"[^>]*>([\s\S]*?)<\/span>/i);

        const title = this.stripHTML(titleMatch?.[1] || '').trim();
        const company = this.stripHTML(companyMatch?.[1] || '').trim() || 'Startup';
        if (!title || title.length < 3) continue;

        items.push({
          title,
          organization: company,
          category: this.parseCategory(title),
          description: `${title} at ${company}`,
          sourceUrl: 'https://wellfound.com/internships',
          applyUrl: 'https://wellfound.com/internships',
          location: 'India',
          mode: 'remote',
          deadline: null,
          skillsRequired: [],
          stipend: '',
          prize: '',
          tags: ['startup', 'wellfound'],
          externalId: this.generateExternalId(title, company),
          eligibility: 'Open to all',
          requirements: [],
        });
      }
    }

    console.log(`[connector:${this.id}] Found ${items.length} Wellfound opportunities`);
    return items;
  }

  stripHTML(html) {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}
