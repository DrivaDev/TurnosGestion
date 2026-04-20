const express = require('express');
const router  = express.Router();
const { sendReminders } = require('../services/email');
const { Tenant, User, Config, Appointment } = require('../db/models');

async function purgeInactiveTenants() {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 3);

  const stale = await Tenant.find({ active: false, deactivatedAt: { $lte: cutoff } }).lean();
  if (!stale.length) return { purged: 0 };

  for (const t of stale) {
    await Promise.all([
      Appointment.deleteMany({ tenantId: t._id }),
      User.deleteMany({ tenantId: t._id }),
      Config.deleteOne({ _id: t._id }),
      Tenant.deleteOne({ _id: t._id }),
    ]);
    console.log(`[Purge] Tenant eliminado: ${t.name} (${t._id})`);
  }
  return { purged: stale.length };
}

// Llamado por Vercel Cron Jobs — corre recordatorios para TODOS los tenants
router.post('/', async (req, res) => {
  const secret = (req.headers['authorization'] || '').replace('Bearer ', '');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET)
    return res.status(401).json({ error: 'Unauthorized' });
  try {
    const [, purgeResult] = await Promise.all([sendReminders(), purgeInactiveTenants()]);
    res.json({ ok: true, time: new Date().toISOString(), ...purgeResult });
  } catch (err) {
    console.error('[Cron]', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', (_, res) => res.json({ status: 'Cron endpoint activo' }));

module.exports = router;
