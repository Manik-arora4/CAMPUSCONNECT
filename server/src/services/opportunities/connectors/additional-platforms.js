/**
 * Additional platform connectors.
 * More reliable sources: RSS feeds, public APIs, well-known platforms.
 */

import { BaseConnector } from './base.js';

// ─── Unstop (Dare2Compete) — hackathons, competitions, internships ───
export class UnstopConnector extends BaseConnector {
  constructor() {
    super({
      id: 'unstop',
      name: 'Unstop (Dare2Compete)',
      source: 'Unstop',
      type: 'scraper',
      baseUrl: 'https://unstop.com',
    });
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching Unstop opportunities`);
    const items = [];

    const categories = [
      { url: 'https://unstop.com/hackathons', type: 'hackathon' },
      { url: 'https://unstop.com/competitions', type: 'competition' },
      { url: 'https://unstop.com/internships', type: 'internship' },
      { url: 'https://unstop.com/jobs', type: 'job' },
      { url: 'https://unstop.com/scholarships', type: 'scholarship' },
    ];

    for (const cat of categories) {
      const res = await this.safeFetch(cat.url);
      if (!res || !res.ok) continue;
      const html = await res.text();

      // Unstop uses card-based layout — extract from card patterns
      const cardPattern = /<div[^>]*class="[^"]*card[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
      let match;
      while ((match = cardPattern.exec(html)) !== null) {
        const block = match[1];
        const titleMatch = block.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i);
        const linkMatch = block.match(/<a[^>]*href="([^"]*)"[^>]*>/i);
        const orgMatch = block.match(/<span[^>]*>([\s\S]*?)<\/span>/i);
        const deadlineMatch = block.match(/deadline[:\s]*([\s\S]*?)(?:<|$)/i);

        const title = this.stripHTML(titleMatch?.[1] || '').trim();
        if (!title || title.length < 5) continue;
        if (/login|sign|register/i.test(title)) continue;

        const href = linkMatch?.[1] || '';
        const fullUrl = href.startsWith('http') ? href : `https://unstop.com${href}`;
        const org = this.stripHTML(orgMatch?.[1] || '').trim() || 'Various';
        const deadline = this.parseDeadline(deadlineMatch?.[1] || '');

        items.push({
          title,
          organization: org,
          category: cat.type,
          description: `${title} — ${cat.type} on Unstop`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: 'India',
          mode: 'remote',
          deadline,
          skillsRequired: [],
          stipend: '',
          prize: '',
          tags: ['unstop', cat.type],
          externalId: this.generateExternalId(title, 'Unstop'),
          eligibility: 'Open to college students',
          requirements: [],
        });
      }
      await this.delay();
    }

    console.log(`[connector:${this.id}] Found ${items.length} Unstop opportunities`);
    return items;
  }

  stripHTML(html) {
    return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8211;/g, '-').replace(/\s+/g, ' ').trim();
  }
}

// ─── LinkedIn Jobs RSS Feed ───
export class LinkedInJobsConnector extends BaseConnector {
  constructor() {
    super({
      id: 'linkedin-jobs',
      name: 'LinkedIn Jobs India',
      source: 'LinkedIn',
      type: 'rss',
      baseUrl: 'https://www.linkedin.com',
    });
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching LinkedIn jobs RSS`);
    const items = [];

    // LinkedIn public RSS feeds for India jobs by category
    const feeds = [
      'https://www.linkedin.com/jobs/search/?keywords=internship&location=India&f_TPR=r604800',
      'https://www.linkedin.com/jobs/search/?keywords=entry+level&location=India&f_TPR=r604800',
    ];

    for (const feedUrl of feeds) {
      const res = await this.safeFetch(feedUrl, {
        headers: { Accept: 'text/html,application/xhtml+xml' },
      });
      if (!res || !res.ok) continue;
      const html = await res.text();

      // Parse LinkedIn job listings from HTML
      const cardPattern = /<a[^>]*href="(\/jobs\/view\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = cardPattern.exec(html)) !== null) {
        const [, href, content] = match;
        const titleMatch = content.match(/<span[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const companyMatch = content.match(/<span[^>]*class="[^"]*company[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const locationMatch = content.match(/<span[^>]*class="[^"]*location[^"]*"[^>]*>([\s\S]*?)<\/span>/i);

        const title = this.stripHTML(titleMatch?.[1] || '').trim();
        if (!title || title.length < 3) continue;

        const company = this.stripHTML(companyMatch?.[1] || '').trim() || 'Various';
        const location = this.stripHTML(locationMatch?.[1] || '').trim() || 'India';
        const fullUrl = href.startsWith('http') ? href : `https://www.linkedin.com${href}`;

        items.push({
          title,
          organization: company,
          category: 'job',
          description: `${title} at ${company} via LinkedIn`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location,
          mode: /remote|wfh/i.test(location) ? 'remote' : 'onsite',
          deadline: null,
          skillsRequired: [],
          stipend: '',
          prize: '',
          tags: ['linkedin', 'job'],
          externalId: this.generateExternalId(title, company),
          eligibility: 'Open to all',
          requirements: [],
        });
      }
      await this.delay();
    }

    console.log(`[connector:${this.id}] Found ${items.length} LinkedIn jobs`);
    return items;
  }

  stripHTML(html) {
    return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  }
}

// ─── Wellfound (AngelList Talent) — startups, tech jobs ───
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

    const urls = [
      'https://wellfound.com/jobs',
      'https://wellfound.com/internships',
    ];

    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();

      // Parse job cards
      const cardPattern = /<a[^>]*href="(\/jobs\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = cardPattern.exec(html)) !== null) {
        const [, href, content] = match;
        const title = this.stripHTML(content.match(/<(?:h[2-4]|span)[^>]*>([\s\S]*?)<\/(?:h[2-4]|span)>/i)?.[1] || '').trim();
        if (!title || title.length < 3) continue;

        const fullUrl = href.startsWith('http') ? href : `https://wellfound.com${href}`;
        items.push({
          title,
          organization: 'Startup',
          category: 'job',
          description: `${title} — startup job on Wellfound`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: 'India / Remote',
          mode: 'remote',
          deadline: null,
          skillsRequired: [],
          stipend: '',
          prize: '',
          tags: ['wellfound', 'startup', 'job'],
          externalId: this.generateExternalId(title, 'Wellfound'),
          eligibility: 'Open to all',
          requirements: [],
        });
      }
      await this.delay();
    }

    console.log(`[connector:${this.id}] Found ${items.length} Wellfound opportunities`);
    return items;
  }

  stripHTML(html) {
    return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

// ─── DRDO — Defence Research & Development Organisation ───
export class DRDOConnector extends BaseConnector {
  constructor() {
    super({
      id: 'drdo',
      name: 'DRDO Career Portal',
      source: 'DRDO',
      type: 'scraper',
      baseUrl: 'https://www.drdo.gov.in',
    });
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching DRDO opportunities`);
    const items = [];

    const urls = [
      'https://www.drdo.gov.in/drdo/careers',
      'https://www.drdo.gov.in/drdo/recruitment',
    ];

    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();

      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|research|fellow|scholar|train|recruit|apprentice|project)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith('http') ? href : new URL(href, this.baseUrl).href;

        items.push({
          title: cleanTitle,
          organization: 'DRDO',
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from DRDO: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: 'New Delhi, India',
          mode: 'onsite',
          deadline: null,
          skillsRequired: [],
          stipend: '',
          prize: '',
          tags: ['drdo', 'government', 'defence', 'research'],
          externalId: this.generateExternalId(cleanTitle, 'DRDO'),
          eligibility: 'Indian citizens. Engineering/Science students eligible for internships.',
          requirements: [],
        });
      }
      await this.delay();
    }

    console.log(`[connector:${this.id}] Found ${items.length} DRDO opportunities`);
    return items;
  }
}

// ─── ISRO — Indian Space Research Organisation ───
export class ISROConnector extends BaseConnector {
  constructor() {
    super({
      id: 'isro',
      name: 'ISRO Career Portal',
      source: 'ISRO',
      type: 'scraper',
      baseUrl: 'https://www.isro.gov.in',
    });
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching ISRO opportunities`);
    const items = [];

    const urls = [
      'https://www.isro.gov.in/careers',
      'https://www.isro.gov.in/internships',
      'https://www.isro.gov.in/recruitment',
    ];

    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();

      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|research|fellow|train|recruit|apprentice|project)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith('http') ? href : new URL(href, this.baseUrl).href;

        items.push({
          title: cleanTitle,
          organization: 'ISRO',
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from ISRO: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: 'Bangalore, India',
          mode: 'onsite',
          deadline: null,
          skillsRequired: [],
          stipend: '',
          prize: '',
          tags: ['isro', 'government', 'space', 'research'],
          externalId: this.generateExternalId(cleanTitle, 'ISRO'),
          eligibility: 'Indian citizens. Engineering/Science students eligible.',
          requirements: [],
        });
      }
      await this.delay();
    }

    console.log(`[connector:${this.id}] Found ${items.length} ISRO opportunities`);
    return items;
  }
}

// ─── CSIR — Council of Scientific & Industrial Research ───
export class CSIRConnector extends BaseConnector {
  constructor() {
    super({
      id: 'csir',
      name: 'CSIR Portal',
      source: 'CSIR',
      type: 'scraper',
      baseUrl: 'https://www.csir.res.in',
    });
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching CSIR opportunities`);
    const items = [];

    const urls = [
      'https://www.csir.res.in/careers',
      'https://www.csir.res.in/internships',
    ];

    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();

      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|research|fellow|scholar|train|recruit)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith('http') ? href : new URL(href, this.baseUrl).href;

        items.push({
          title: cleanTitle,
          organization: 'CSIR',
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from CSIR: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: 'New Delhi, India',
          mode: 'onsite',
          deadline: null,
          skillsRequired: [],
          stipend: '',
          prize: '',
          tags: ['csir', 'government', 'research'],
          externalId: this.generateExternalId(cleanTitle, 'CSIR'),
          eligibility: 'Indian citizens. Science/Engineering students.',
          requirements: [],
        });
      }
      await this.delay();
    }

    console.log(`[connector:${this.id}] Found ${items.length} CSIR opportunities`);
    return items;
  }
}

// ─── IIM Connectors ───
export class IIMConnector extends BaseConnector {
  constructor(config) {
    super({
      id: `iim-${config.code?.toLowerCase() || config.iimName.toLowerCase().replace(/\s+/g, '-')}`,
      name: `${config.iimName} Career Portal`,
      source: config.iimName,
      type: 'scraper',
      baseUrl: config.baseUrl,
    });
    this.iimPaths = config.paths || ['/placements', '/career', '/iprs'];
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching ${this.source} opportunities`);
    const items = [];

    for (const p of this.iimPaths) {
      const url = `${this.baseUrl}${p}`;
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();

      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|hack|research|fellow|scholar|train|placement|recruit|competition)[^<]*)<\/a>/gi;
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
          tags: ['iim', this.source.toLowerCase().replace(/\s+/g, '-'), 'management'],
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

// Pre-built IIM instances
export const IIM_AHMEDABAD = new IIMConnector({
  iimName: 'IIM Ahmedabad', code: 'IIMA',
  baseUrl: 'https://www.iima.ac.in', paths: ['/placements', '/career'],
});

export const IIM_BANGALORE = new IIMConnector({
  iimName: 'IIM Bangalore', code: 'IIMB',
  baseUrl: 'https://www.iimb.ac.in', paths: ['/placements', '/career'],
});

export const IIM_CALCUTTA = new IIMConnector({
  iimName: 'IIM Calcutta', code: 'IIMC',
  baseUrl: 'https://www.iimcal.ac.in', paths: ['/placements', '/career'],
});

export const IIM_LUCKNOW = new IIMConnector({
  iimName: 'IIM Lucknow', code: 'IIML',
  baseUrl: 'https://www.iiml.ac.in', paths: ['/placements', '/career'],
});

// ─── Government Internship Portal (internship.gov.in) ───
export class GovInternshipPortalConnector extends BaseConnector {
  constructor() {
    super({
      id: 'gov-internship-portal',
      name: 'Government Internship Portal',
      source: 'Government of India',
      type: 'scraper',
      baseUrl: 'https://internship.gov.in',
    });
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching government internships`);
    const items = [];

    const urls = [
      'https://internship.gov.in/',
      'https://www.myscheme.gov.in/search/internship',
    ];

    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();

      // Extract cards with titles
      const cardPattern = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = cardPattern.exec(html)) !== null) {
        const [, href, content] = match;
        const title = this.stripHTML(content).trim();
        if (title.length < 5 || /login|register|sign|menu|home/i.test(title)) continue;
        const fullUrl = href.startsWith('http') ? href : new URL(href, this.baseUrl).href;

        items.push({
          title,
          organization: 'Government of India',
          category: 'internship',
          description: `Government internship: ${title}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: 'India',
          mode: 'remote',
          deadline: null,
          skillsRequired: [],
          stipend: '',
          prize: '',
          tags: ['government', 'internship', 'india'],
          externalId: this.generateExternalId(title, 'GovInternship'),
          eligibility: 'Indian students as per scheme eligibility',
          requirements: [],
        });
      }
      await this.delay();
    }

    console.log(`[connector:${this.id}] Found ${items.length} government internships`);
    return items;
  }

  stripHTML(html) {
    return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  }
}

// ─── Central Universities Recruitment ───
export class CentralUniversityConnector extends BaseConnector {
  constructor(config) {
    super({
      id: `cu-${config.code}`,
      name: `${config.name} Portal`,
      source: config.name,
      type: 'scraper',
      baseUrl: config.baseUrl,
    });
    this.cuPaths = config.paths || ['/recruitment', '/careers'];
  }

  async fetch() {
    console.log(`[connector:${this.id}] Fetching ${this.source} opportunities`);
    const items = [];

    for (const p of this.cuPaths) {
      const url = `${this.baseUrl}${p}`;
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();

      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|research|fellow|scholar|train|recruit|apprentice|project)[^<]*)<\/a>/gi;
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
          tags: ['central-university', this.source.toLowerCase().replace(/\s+/g, '-')],
          externalId: this.generateExternalId(cleanTitle, this.source),
          eligibility: `${this.source} students and eligible candidates`,
          requirements: [],
        });
      }
      await this.delay();
    }

    console.log(`[connector:${this.id}] Found ${items.length} ${this.source} opportunities`);
    return items;
  }
}

// Pre-built Central University instances
export const DU_DELHI = new CentralUniversityConnector({
  name: 'University of Delhi', code: 'DU',
  baseUrl: 'https://www.du.ac.in', paths: ['/recruitment', '/iprcell'],
});

export const JNU_DELHI = new CentralUniversityConnector({
  name: 'Jawaharlal Nehru University', code: 'JNU',
  baseUrl: 'https://www.jnu.ac.in', paths: ['/recruitment', '/career'],
});

export const BHU_VARANASI = new CentralUniversityConnector({
  name: 'Banaras Hindu University', code: 'BHU',
  baseUrl: 'https://www.bhu.ac.in', paths: ['/recruitment', '/career'],
});

export const AMU_ALIGARH = new CentralUniversityConnector({
  name: 'Aligarh Muslim University', code: 'AMU',
  baseUrl: 'https://www.amu.ac.in', paths: ['/recruitment', '/career'],
});
