/**
 * Base connector for opportunity sources.
 * All connectors extend this and implement fetch().
 * 
 * Pipeline: Source → Fetch → Parse → Normalize → Return NormalizedOpp[]
 */

/**
 * @typedef {Object} NormalizedOpp
 * @property {string} title
 * @property {string} organization
 * @property {string} category - internship|hackathon|job|scholarship|fellowship|competition|research|workshop|training|conference
 * @property {string} description
 * @property {string} sourceUrl - original URL from the source
 * @property {string} applyUrl - direct application URL
 * @property {string} location
 * @property {string} mode - remote|onsite|hybrid
 * @property {string} deadline - ISO date string
 * @property {string[]} skillsRequired
 * @property {string} stipend
 * @property {string} prize
 * @property {string[]} tags
 * @property {string} externalId - unique ID from source (for dedup)
 * @property {string} eligibility
 * @property {string[]} requirements
 */

export class BaseConnector {
  /**
   * @param {Object} config
   * @param {string} config.id - unique connector ID (e.g., 'iit-delhi-careers')
   * @param {string} config.name - human-readable name (e.g., 'IIT Delhi Career Portal')
   * @param {string} config.source - source organization (e.g., 'IIT Delhi')
   * @param {string} config.type - 'rss' | 'scraper' | 'api' | 'manual'
   * @param {string} config.baseUrl
   * @param {number} [config.rateLimitMs=2000] - delay between requests
   */
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.source = config.source;
    this.type = config.type;
    this.baseUrl = config.baseUrl;
    this.rateLimitMs = config.rateLimitMs || 2000;
  }

  /**
   * Fetch opportunities from this source.
   * Must be implemented by subclasses.
   * @returns {Promise<NormalizedOpp[]>}
   */
  async fetch() {
    throw new Error(`${this.id}: fetch() not implemented`);
  }

  /**
   * Parse a category string from source into our standard categories.
   */
  parseCategory(raw) {
    if (!raw) return 'other';
    const lower = raw.toLowerCase().trim();
    if (/intern/.test(lower)) return 'internship';
    if (/hack|cod(e|ing)/.test(lower)) return 'hackathon';
    if (/job|position|role|recruit/.test(lower)) return 'job';
    if (/scholar|fellow|grant|aid/.test(lower)) return 'scholarship';
    if (/train|boot/.test(lower)) return 'training';
    if (/workshop|seminar/.test(lower)) return 'workshop';
    if (/compet|contest|challenge/.test(lower)) return 'competition';
    if (/fellow/.test(lower)) return 'fellowship';
    if (/research|lab|phd/.test(lower)) return 'research';
    if (/conf|summit|symposium/.test(lower)) return 'conference';
    return 'other';
  }

  /**
   * Parse mode from raw string.
   */
  parseMode(raw) {
    if (!raw) return 'onsite';
    const lower = raw.toLowerCase();
    if (/remote|online|virtual|anywhere/.test(lower)) return 'remote';
    if (/hybrid/.test(lower)) return 'hybrid';
    return 'onsite';
  }

  /**
   * Extract deadline from various formats.
   */
  parseDeadline(raw) {
    if (!raw) return null;
    try {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) return d.toISOString();
    } catch {}
    // Try common patterns
    const match = raw.match(/(\d{1,2})\s*[-/]\s*(\d{1,2})\s*[-/]\s*(\d{2,4})/);
    if (match) {
      const d = new Date(`${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    return null;
  }

  /**
   * Delay for rate limiting.
   */
  async delay() {
    return new Promise((r) => setTimeout(r, this.rateLimitMs));
  }

  /**
   * Safe fetch with timeout and error handling.
   */
  async safeFetch(url, options = {}) {
    const timeout = options.timeout || 15000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': 'CampusConnect/1.0 (Academic Platform)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8',
          ...(options.headers || {}),
        },
      });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      console.warn(`[connector:${this.id}] fetch failed for ${url}: ${err.message}`);
      return null;
    }
  }

  /**
   * Generate a unique external ID from title + organization.
   */
  generateExternalId(title, org) {
    const slug = `${title}|${org}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return slug.slice(0, 128);
  }
}
