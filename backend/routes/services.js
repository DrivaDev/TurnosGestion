const express = require('express');
const router  = express.Router();
const { Service } = require('../db/models');

// GET /api/services
router.get('/', async (req, res) => {
  try {
    const services = await Service.find({ tenantId: req.user.tenantId }).sort({ createdAt: 1 }).lean({ virtuals: true });
    res.json(services);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/services
router.post('/', async (req, res) => {
  try {
    const { name, description, durationMin, price } = req.body;
    if (!name || !durationMin) return res.status(400).json({ error: 'Nombre y duración son requeridos' });
    const s = await Service.create({ tenantId: req.user.tenantId, name, description, durationMin: Number(durationMin), price: price ? Number(price) : null });
    res.status(201).json(s.toJSON());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/services/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, description, durationMin, price, active } = req.body;
    const s = await Service.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { $set: { name, description, durationMin: Number(durationMin), price: price != null ? Number(price) : null, active } },
      { new: true }
    );
    if (!s) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json(s.toJSON());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/services/:id
router.delete('/:id', async (req, res) => {
  try {
    await Service.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
