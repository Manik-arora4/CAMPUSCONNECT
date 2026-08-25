/**
 * Opportunity Aggregator Service.
 * 
 * Pipeline: Source → Fetch → Parse → Normalize → Deduplicate → Store
 * 
 * Orchestrates all connectors, handles deduplication, and stores results in DB.
 * Includes retry logic, concurrency control, and comprehensive error handling.
 */

import { prisma } from '../../lib/prisma.js';
import { connectors } from './connectors/index.js';

/**
 * Fetch opportunities from ALL registered connectors.
 * @param {Object} options
 * @param {string[]} [options.connectorIds] - specific connectors to fetch from (default: all)
 * @param {boolean} [options.dryRun=false] - if true, don't write to DB
 * @param {number} [options.retries=1] - number of retries per connector on failure
 * @returns {Promise<{total:number, stored:number, duplicates:number, errors:number, byConnector:Object}>}
 */
export async function fetchAllOpportunities({ connectorIds = null, dryRun = false, retries = 1 } = {}) {
  const startTime = Date.now();
  const activeConnectors = connectorIds
    ? connectors.filter((c) => connectorIds.includes(c.id))
    : connectors;

  console.log(`[aggregator] Starting fetch from ${activeConnectors.length} connectors...`);

  let total = 0;
  let stored = 0;
  let duplicates = 0;
  let errors = 0;
  const byConnector = {};

  // Process connectors sequentially to avoid overwhelming remote servers
  for (const connector of activeConnectors) {
    let lastError = null;
    let items = [];

    // Retry logic
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[aggregator] Retrying ${connector.id} (attempt ${attempt + 1})...`);
          await new Promise((r) => setTimeout(r, 3000)); // 3s delay before retry
        }
        items = await connector.fetch();
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
        console.warn(`[aggregator] ${connector.id} attempt ${attempt + 1} failed: ${err.message}`);
      }
    }

    if (lastError) {
      console.error(`[aggregator] Connector ${connector.id} failed after ${retries + 1} attempts: ${lastError.message}`);
      byConnector[connector.id] = { fetched: 0, stored: 0, duplicates: 0, error: lastError.message };
      errors++;
      continue;
    }

    total += items.length;
    byConnector[connector.id] = { fetched: items.length, stored: 0, duplicates: 0 };

    for (const item of items) {
      try {
        const result = await storeOpportunity(item, connector, dryRun);
        if (result === 'stored') {
          stored++;
          byConnector[connector.id].stored++;
        } else if (result === 'duplicate') {
          duplicates++;
          byConnector[connector.id].duplicates++;
        }
      } catch (err) {
        console.warn(`[aggregator] Failed to store: ${item.title}: ${err.message}`);
        errors++;
      }
    }

    console.log(`[aggregator] ${connector.id}: fetched=${items.length}, stored=${byConnector[connector.id].stored}, dupes=${byConnector[connector.id].duplicates}`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[aggregator] ✅ Done in ${elapsed}s — total=${total}, stored=${stored}, duplicates=${duplicates}, errors=${errors}`);

  return { total, stored, duplicates, errors, byConnector, elapsed };
}

/**
 * Store a single normalized opportunity in the DB.
 * Handles deduplication via externalId + source, and also via title + organization for fuzzy dedup.
 * @returns {'stored'|'duplicate'|'updated'}
 */
export async function storeOpportunity(item, connector, dryRun = false) {
  const externalId = item.externalId || null;
  const source = item.organization || connector.source;

  // Deduplication layer 1: externalId + source (exact match)
  if (externalId) {
    const existing = await prisma.opportunity.findFirst({
      where: {
        externalId,
        source: { contains: source, mode: 'insensitive' },
      },
    });

    if (existing) {
      // Update lastSynced and any changed fields
      const updateData = { lastSynced: new Date() };
      if (item.deadline) updateData.deadline = new Date(item.deadline);
      if (item.description && item.description !== existing.description) updateData.description = item.description;
      if (item.applyUrl && item.applyUrl !== existing.applyUrl) updateData.applyUrl = item.applyUrl;
      if (item.sourceUrl && item.sourceUrl !== existing.sourceUrl) updateData.sourceUrl = item.sourceUrl;

      await prisma.opportunity.update({ where: { id: existing.id }, data: updateData });
      return 'duplicate';
    }
  }

  // Deduplication layer 2: title + organization (fuzzy match via contains)
  const titleLower = (item.title || '').toLowerCase().trim();
  if (titleLower.length > 10) {
    const existing = await prisma.opportunity.findFirst({
      where: {
        title: { contains: item.title, mode: 'insensitive' },
        organization: { contains: source, mode: 'insensitive' },
        status: { notIn: ['expired', 'rejected'] },
      },
    });

    if (existing) {
      await prisma.opportunity.update({
        where: { id: existing.id },
        data: { lastSynced: new Date() },
      });
      return 'duplicate';
    }
  }

  if (dryRun) return 'stored';

  await prisma.opportunity.create({
    data: {
      title: item.title,
      organization: source,
      category: item.category || 'other',
      description: item.description || '',
      skillsRequired: item.skillsRequired || [],
      eligibility: item.eligibility || '',
      courseRestrictions: item.courseRestrictions || [],
      degreeRestrictions: item.degreeRestrictions || [],
      yearMin: item.yearMin || 1,
      yearMax: item.yearMax || 4,
      semesterMin: item.semesterMin || 1,
      semesterMax: item.semesterMax || 8,
      mandatorySkills: item.mandatorySkills || [],
      experienceLevel: item.experienceLevel || 'any',
      location: item.location || 'India',
      mode: item.mode || 'onsite',
      stipend: item.stipend || '',
      prize: item.prize || '',
      deadline: item.deadline ? new Date(item.deadline) : new Date(Date.now() + 90 * 86400000),
      postedDate: new Date(),
      applyLink: item.applyUrl || item.sourceUrl || '',
      sourceUrl: item.sourceUrl || '',
      applyUrl: item.applyUrl || '',
      sourceConnector: connector.id,
      source: `fetched:${source}`,
      externalId: externalId,
      requirements: item.requirements || [],
      applicationProcess: item.applicationProcess || '',
      tags: item.tags || [],
      status: 'verified',
      lastSynced: new Date(),
      expiresAt: item.deadline ? new Date(item.deadline) : new Date(Date.now() + 90 * 86400000),
    },
  });

  return 'stored';
}

/**
 * Archive expired opportunities.
 * Sets status to 'expired' for opportunities past their deadline.
 */
export async function archiveExpiredOpportunities() {
  const result = await prisma.opportunity.updateMany({
    where: {
      status: 'verified',
      deadline: { lt: new Date() },
    },
    data: {
      status: 'expired',
    },
  });
  if (result.count > 0) console.log(`[aggregator] Archived ${result.count} expired opportunities`);
  return result.count;
}

/**
 * Get sync status for all connectors.
 */
export async function getSyncStatus() {
  const connectorStats = await prisma.opportunity.groupBy({
    by: ['sourceConnector'],
    _count: { id: true },
    _max: { lastSynced: true },
    where: { sourceConnector: { not: '' } },
  });

  const totalFetched = await prisma.opportunity.count({
    where: { sourceConnector: { not: '' } },
  });

  const totalManual = await prisma.opportunity.count({
    where: { sourceConnector: '' },
  });

  const totalVerified = await prisma.opportunity.count({
    where: { status: 'verified' },
  });

  const totalExpired = await prisma.opportunity.count({
    where: { status: 'expired' },
  });

  return {
    totalFetched,
    totalManual,
    totalVerified,
    totalExpired,
    totalAll: totalFetched + totalManual,
    connectors: connectorStats.map((s) => ({
      id: s.sourceConnector,
      count: s._count.id,
      lastSynced: s._max.lastSynced,
    })),
  };
}
