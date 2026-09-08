const { Router } = require('express');
const prisma = require('../lib/prisma');
const { authenticate, asyncHandler } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  let prefs = await prisma.userPreference.findUnique({ where: { user: req.user.id } });
  if (!prefs) {
    prefs = await prisma.userPreference.create({ data: { user: req.user.id } });
  }
  res.json({ preferences: prefs });
}));

router.put('/', asyncHandler(async (req, res) => {
  let prefs = await prisma.userPreference.findUnique({ where: { user: req.user.id } });
  const allowed = ['notifications', 'defaultView', 'weeklyDigest'];
  const data = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });

  if (prefs) {
    prefs = await prisma.userPreference.update({ where: { id: prefs.id }, data });
  } else {
    prefs = await prisma.userPreference.create({ data: { user: req.user.id, ...data } });
  }
  res.json({ preferences: prefs });
}));

module.exports = router;
