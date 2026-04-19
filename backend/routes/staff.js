const express = require('express');
const router  = express.Router();
const { Staff } = require('../db/models');

function lean(doc) { return { ...doc, id: doc._id.toString(), _id: undefined }; }

router.get('/', async (req, res) => {
  try {
    const docs = await Staff.find({ tenantId: req.user.tenantId }).sort({ order: 1, createdAt: 1 }).lean();
    res.json(docs.map(lean));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, photo, serviceIds, active } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'El nombre es requerido' });
    const s = await Staff.create({ tenantId: req.user.tenantId, name: name.trim(), photo: photo || '', serviceIds: serviceIds || [], active: active ?? true });
    res.status(201).json(lean(s.toObject()));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, photo, serviceIds, active, order } = req.body;
    const s = await Staff.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { $set: { name, photo, serviceIds, active, order } },
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
