/**
 * Opportunity Sync API Routes.
 * POST /api/opportunities/sync — trigger a fetch from all/specific connectors
 * GET  /api/opportunities/sync/status — get sync status for all connectors
 */

import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { fetchAllOpportunities, archiveExpiredOpportunities, getSyncStatus } from '../services/opportunities/aggregator.js';
import { connectors, getConnectorIds } from '../services/opportunities/connectors/index.js';

const router = Router();

// GET /api/opportunities/sync/status — sync status for all connectors
router.get('/status', auth, requireAdmin, asyncHandler(async (req, res) => {
  const status = await getSyncStatus();
  const availableConnectors = connectors.map((c) => ({
    id: c.id,
    name: c.name,
    source: c.source,
    type: c.type,
  }));
  res.json({ ...status, availableConnectors });
}));

// POST /api/opportunities/sync — trigger a sync
router.post('/', auth, requireAdmin, asyncHandler(async (req, res) => {
  const { connectorIds, dryRun } = req.body || {};
  const ids = Array.isArray(connectorIds) && connectorIds.length > 0 ? connectorIds : null;

  console.log(`[sync] Admin ${req.user.id} triggered sync (connectors: ${ids ? ids.join(',') : 'all'}, dryRun: ${!!dryRun})`);

  // Run sync in background — don't block the response
  const syncPromise = fetchAllOpportunities({ connectorIds: ids, dryRun: !!dryRun });

  // Return immediately with a "sync started" response
  res.json({
    message: 'Sync started',
    connectors: ids || getConnectorIds(),
    dryRun: !!dryRun,
  });

  // Log results when done
  syncPromise.then((result) => {
    console.log(`[sync] Completed:`, JSON.stringify(result));
  }).catch((err) => {
    console.error(`[sync] Failed:`, err.message);
  });
}));

// POST /api/opportunities/sync/archive — archive expired opportunities
router.post('/archive', auth, requireAdmin, asyncHandler(async (req, res) => {
  const count = await archiveExpiredOpportunities();
  res.json({ message: `Archived ${count} expired opportunities`, count });
}));

export default router;
