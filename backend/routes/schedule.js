const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/schedule
router.get('/', async (req, res) => {
  try {
    const raw = await db.getSetting('schedule') || '{}';
    res.json(JSON.parse(raw));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/schedule
router.put('/', async (req, res) => {
  try {
    const schedule = req.body;
    const days = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];
    for (const day of days) {
      const d = schedule[day];
      if (!d) continue;
      if (typeof d.enabled !== 'boolean')
        return res.status(400).json({ error: `Campo enabled inválido en ${day}` });
      if (d.enabled && (!d.start || !d.end || !d.slotDuration))
        return res.status(400).json({ error: `Faltan campos en ${day}` });
    }
    await db.setSetting('schedule', JSON.stringify(schedule));
    res.json({ ok: true, schedule });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/schedule/blocked-days
router.get('/blocked-days', async (req, res) => {
  try { res.json(await db.getBlockedDays()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/schedule/blocked-days
router.post('/blocked-days', async (req, res) => {
  try {
    const { date } = req.body;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
      return res.status(400).json({ error: 'Formato de fecha inválido. Usar YYYY-MM-DD' });
    await db.addBlockedDay(date);
    res.status(201).json({ ok: true, date });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/schedule/blocked-days/:date
router.delete('/blocked-days/:date', async (req, res) => {
  try {
    await db.removeBlockedDay(req.params.date);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
