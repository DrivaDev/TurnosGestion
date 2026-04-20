const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const { Tenant, User, Config, Appointment, Staff } = require('../db/models');

const JWT_SECRET = () => process.env.JWT_SECRET || 'dev-secret-change-in-production';

function endOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
}

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const adminEmail    = process.env.SUPERADMIN_EMAIL;
  const adminPassword = process.env.SUPERADMIN_PASSWORD;
  if (!adminEmail || !adminPassword)
    return res.status(500).json({ error: 'Super-admin no configurado en el servidor' });
  if (email !== adminEmail || password !== adminPassword)
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  const token = jwt.sign({ role: 'superadmin' }, JWT_SECRET(), { expiresIn: '7d' });
  res.json({ token });
});

// GET /api/admin/tenants
router.get('/tenants', async (req, res) => {
  try {
    const tenants = await Tenant.find({}).sort({ createdAt: -1 }).lean();
    const now   = new Date();
    const y     = now.getFullYear();
    const m     = now.getMonth();
    const start = new Date(y, m, 1).toISOString().slice(0, 10);
    const end   = new Date(y, m + 1, 0).toISOString().slice(0, 10);

    const list = await Promise.all(tenants.map(async t => {
      const [totalCount, monthCount, todayCount, adminUser, staffCount] = await Promise.all([
        Appointment.countDocuments({ tenantId: t._id }),
        Appointment.countDocuments({ tenantId: t._id, date: { $gte: start, $lte: end } }),
        Appointment.countDocuments({ tenantId: t._id, date: now.toISOString().slice(0,10) }),
        User.findOne({ tenantId: t._id, role: 'admin' }).lean(),
        Staff.countDocuments({ tenantId: t._id }),
      ]);
      const isPaid = t.paidUntil && new Date(t.paidUntil) >= now;
      return {
        id:        t._id,
        name:      t.name,
        slug:      t.slug,
        active:    t.active,
        approved:  t.approved,
        plan:      t.plan || 'basic',
        notes:     t.notes || '',
        paidUntil: t.paidUntil || null,
        isPaid,
        createdAt: t.createdAt,
        deactivatedAt: t.deactivatedAt || null,
        adminName:  adminUser?.name  || '',
        adminEmail: adminUser?.email || '',
        stats: { total: totalCount, thisMonth: monthCount, today: todayCount, staff: staffCount },
      };
    }));
    res.json(list);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/tenants/:id
router.put('/tenants/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Negocio no encontrado' });

    const { paidUntil, notes, active, approved, plan, markPaidThisMonth } = req.body;

    if (markPaidThisMonth) {
      tenant.paidUntil = endOfMonth();
    } else if (paidUntil !== undefined) {
      tenant.paidUntil = paidUntil ? new Date(paidUntil) : null;
    }
    if (notes    !== undefined) tenant.notes    = notes;
    if (approved !== undefined) tenant.approved = approved;
    if (plan     !== undefined) tenant.plan     = plan;
    if (active   !== undefined) {
      if (!active && tenant.active) tenant.deactivatedAt = new Date();
      if (active)                   tenant.deactivatedAt = null;
      tenant.active = active;
    }
    await tenant.save();
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/admin/tenants/:id
router.delete('/tenants/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Negocio no encontrado' });
    await Promise.all([
      Appointment.deleteMany({ tenantId: tenant._id }),
      User.deleteMany({ tenantId: tenant._id }),
      Config.deleteOne({ _id: tenant._id }),
      Staff.deleteMany({ tenantId: tenant._id }),
      Tenant.deleteOne({ _id: tenant._id }),
    ]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
