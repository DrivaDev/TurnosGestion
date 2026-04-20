const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const router   = express.Router();
const { Tenant, User } = require('../db/models');
const { initTenantConfig } = require('../database');
const auth = require('../middleware/auth');

const JWT_SECRET  = () => process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES = '30d';

function makeToken(user, tenant) {
  return jwt.sign(
    { userId: user._id, tenantId: tenant._id, role: user.role, businessName: tenant.name, slug: tenant.slug, approved: tenant.approved, plan: tenant.plan || 'basic' },
    JWT_SECRET(),
    { expiresIn: JWT_EXPIRES }
  );
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50);
}

async function uniqueSlug(base) {
  let slug = base;
  let i = 2;
  while (await Tenant.exists({ slug })) { slug = `${base}-${i++}`; }
  return slug;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { businessName, name, email, password } = req.body;
    if (!businessName || !name || !email || !password)
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    if (password.length < 6)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

    if (await User.exists({ email: email.toLowerCase() }))
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });

    const slug   = await uniqueSlug(generateSlug(businessName));
    // First month free for basic plan: set paidUntil to end of current month
    const freeUntil = new Date();
    freeUntil.setMonth(freeUntil.getMonth() + 1, 0); // Last day of current month
    freeUntil.setHours(23, 59, 59);
    const tenant = await Tenant.create({ name: businessName, slug, paidUntil: freeUntil });
    const passwordHash = await bcrypt.hash(password, 12);
    const user   = await User.create({ tenantId: tenant._id, name, email, passwordHash, role: 'admin' });
    await initTenantConfig(tenant._id, businessName);

    res.status(201).json({
      token: makeToken(user, tenant),
      user: { name: user.name, email: user.email, role: user.role, businessName: tenant.name, slug: tenant.slug, approved: tenant.approved, plan: tenant.plan || 'basic' },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });

    const tenant = await Tenant.findById(user.tenantId);
    res.json({
      token: makeToken(user, tenant),
      user: { name: user.name, email: user.email, role: user.role, businessName: tenant.name, slug: tenant.slug, approved: tenant.approved, plan: tenant.plan || 'basic' },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user   = await User.findById(req.user.userId).select('-passwordHash');
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!user || !tenant) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ name: user.name, email: user.email, role: user.role, businessName: tenant.name, slug: tenant.slug, approved: tenant.approved, active: tenant.active, plan: tenant.plan || 'basic' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
