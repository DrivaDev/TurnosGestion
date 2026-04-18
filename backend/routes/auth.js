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
    { userId: user._id, tenantId: tenant._id, role: user.role, businessName: tenant.name },
    JWT_SECRET(),
    { expiresIn: JWT_EXPIRES }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { businessName, name, email, password } = req.body;
    if (!businessName || !name || !email || !password)
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    if (password.length < 6)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });

    const tenant = await Tenant.create({ name: businessName });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ tenantId: tenant._id, name, email, passwordHash, role: 'admin' });

    await initTenantConfig(tenant._id, businessName);

    res.status(201).json({ token: makeToken(user, tenant), user: { name: user.name, email: user.email, role: user.role, businessName: tenant.name } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Email o contraseña incorrectos' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Email o contraseña incorrectos' });

    const tenant = await Tenant.findById(user.tenantId);
    res.json({ token: makeToken(user, tenant), user: { name: user.name, email: user.email, role: user.role, businessName: tenant.name } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user   = await User.findById(req.user.userId).select('-passwordHash');
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!user || !tenant) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ name: user.name, email: user.email, role: user.role, businessName: tenant.name });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
