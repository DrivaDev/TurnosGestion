const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const { Tenant } = require('../db/models');
const db = require('../database');

const JWT_SECRET = () => process.env.JWT_SECRET || 'dev-secret-change-in-production';

// POST /api/admin/login  — login exclusivo de Driva Dev
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

// GET /api/admin/tenants — lista todos los negocios
router.get('/tenants', async (req, res) => {
  try {
    const tenants = await Tenant.find({}).sort({ createdAt: -1 }).lean();
    const list = await Promise.all(tenants.map(async t => {
      const settings = await db.getAllSettings(t._id);
      return {
        id:          t._id,
        name:        t.name,
        slug:        t.slug,
        createdAt:   t.createdAt,
        description: settings.business_description || '',
        theme: {
          primary:   settings.theme_primary   || '#EA580C',
          secondary: settings.theme_secondary || '#9A3412',
          accent:    settings.theme_accent    || '#FED7AA',
          bg:        settings.theme_bg        || '#FFF7ED',
          logo:      settings.theme_logo      || '',
        },
      };
    }));
    res.json(list);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/tenants/:id — detalle de un negocio
router.get('/tenants/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).lean();
    if (!tenant) return res.status(404).json({ error: 'Negocio no encontrado' });
    const settings = await db.getAllSettings(tenant._id);
    res.json({
      id:          tenant._id,
      name:        tenant.name,
      slug:        tenant.slug,
      createdAt:   tenant.createdAt,
      description: settings.business_description || '',
      theme: {
        primary:   settings.theme_primary   || '#EA580C',
        secondary: settings.theme_secondary || '#9A3412',
        accent:    settings.theme_accent    || '#FED7AA',
        bg:        settings.theme_bg        || '#FFF7ED',
        logo:      settings.theme_logo      || '',
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/tenants/:id — editar negocio (nombre, slug, tema, descripción)
router.put('/tenants/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Negocio no encontrado' });

    const { name, slug, description, theme } = req.body;

    if (name)  tenant.name = name;
    if (slug) {
      const existing = await Tenant.findOne({ slug, _id: { $ne: tenant._id } });
      if (existing) return res.status(409).json({ error: 'Ese slug ya está en uso por otro negocio' });
      tenant.slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    }
    await tenant.save();

    const updates = {};
    if (name)        updates.business_name        = name;
    if (description !== undefined) updates.business_description = description;
    if (theme) {
      if (theme.primary)   updates.theme_primary   = theme.primary;
      if (theme.secondary) updates.theme_secondary = theme.secondary;
      if (theme.accent)    updates.theme_accent    = theme.accent;
      if (theme.bg)        updates.theme_bg        = theme.bg;
      if (theme.logo !== undefined) updates.theme_logo = theme.logo;
    }
    if (Object.keys(updates).length) await db.updateSettings(tenant._id, updates);

    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
