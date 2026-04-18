const express = require('express');
const router  = express.Router();
const db      = require('../database');

router.get('/', async (req, res) => {
  try { res.json(JSON.parse(await db.getSetting(req.user.tenantId, 'schedule') || '{}')); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/', async (req, res) => {
  try {
    const schedule = req.body;
    const days = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];
    for (const day of days) {
      const d = schedule[day];
      if (!d) continue;
      if (typeof d.enabled !== 'boolean')
        return res.status(400).json({ error: `Campo enabled inválido en ${day}` });
      if (d.enabled && (!d.start || !d.end))
        return res.status(400).json({ error: `Faltan campos en ${day}` });
    }
    await db.updateSettings(req.user.tenantId, { schedule: JSON.stringify(schedule) });
    res.json({ ok: true, schedule });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/blocked-days', async (req, res) => {
  try { res.json(await db.getBlockedDays(req.user.tenantId)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/blocked-days', async (req, res) => {
  try {
    const { date } = req.body;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
      return res.status(400).json({ error: 'Formato inválido. Usar YYYY-MM-DD' });
    await db.addBlockedDay(req.user.tenantId, date);
    res.status(201).json({ ok: true, date });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/blocked-days/:date', async (req, res) => {
  try {
    await db.removeBlockedDay(req.user.tenantId, req.params.date);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
