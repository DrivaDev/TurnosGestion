const express = require('express');
const router  = express.Router();
const { Staff, Tenant } = require('../db/models');

function lean(doc) { return { ...doc, id: doc._id.toString(), _id: undefined }; }

async function requirePro(req, res) {
  const tenant = await Tenant.findById(req.user.tenantId).lean();
  if (!tenant || tenant.plan !== 'pro') {
    res.status(403).json({ error: 'Esta función requiere el Plan Pro' });
    return false;
  }
  return true;
}

router.get('/', async (req, res) => {
  try {
    const docs = await Staff.find({ tenantId: req.user.tenantId }).sort({ order: 1, createdAt: 1 }).lean();
    res.json(docs.map(lean));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    if (!await requirePro(req, res)) return;
    const count = await Staff.countDocuments({ tenantId: req.user.tenantId });
    if (count >= 5) return res.status(400).json({ error: 'Límite de 5 profesionales alcanzado' });
    const { name, photo, serviceIds, active, schedule, daysOff } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'El nombre es requerido' });
    const s = await Staff.create({
      tenantId: req.user.tenantId,
      name: name.trim(),
      photo: photo || '',
      serviceIds: serviceIds || [],
      active: active ?? true,
      schedule: schedule || '',
      daysOff: daysOff || [],
    });
    res.status(201).json(lean(s.toObject()));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, photo, serviceIds, active, order, schedule, daysOff } = req.body;
    const s = await Staff.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { $set: { name, photo, serviceIds, active, order, schedule, daysOff } },
      { new: true }
    ).lean();
    if (!s) return res.status(404).json({ error: 'No encontrado' });
    res.json(lean(s));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const s = await Staff.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!s) return res.status(404).json({ error: 'No encontrado' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
