const express = require('express');
const router  = express.Router();
const { sendReminders } = require('../services/email');
const { Tenant, User, Config, Appointment, Staff } = require('../db/models');

// Purge tenants deactivated > 3 months ago
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
      Staff.deleteMany({ tenantId: t._id }),
      Tenant.deleteOne({ _id: t._id }),
    ]);
    console.log(`[Purge] Tenant eliminado: ${t.name} (${t._id})`);
  }
  return { purged: stale.length };
}

// Deactivate tenants that haven't paid after the 10th
async function autoDeactivateUnpaid() {
  const today = new Date();
  if (today.getDate() < 10) return { deactivated: 0 };

  // "Unpaid" = paidUntil is null or expired before start of this month
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const unpaid = await Tenant.find({
    active: true,
    approved: true,
    $or: [
      { paidUntil: null },
      { paidUntil: { $lt: startOfMonth } },
    ],
  }).lean();

  let deactivated = 0;
  for (const t of unpaid) {
    await Tenant.findByIdAndUpdate(t._id, { active: false, deactivatedAt: new Date() });
    console.log(`[Cron] Tenant desactivado por falta de pago: ${t.name}`);
    deactivated++;
  }
  return { deactivated };
}

router.post('/', async (req, res) => {
  const secret = (req.headers['authorization'] || '').replace('Bearer ', '');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET)
    return res.status(401).json({ error: 'Unauthorized' });
  try {
    const [, purgeResult, deactivateResult] = await Promise.all([
      sendReminders(),
      purgeInactiveTenants(),
      autoDeactivateUnpaid(),
    ]);
    res.json({ ok: true, time: new Date().toISOString(), ...purgeResult, ...deactivateResult });
  } catch (err) {
    console.error('[Cron]', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', (_, res) => res.json({ status: 'Cron endpoint activo' }));

module.exports = router;
