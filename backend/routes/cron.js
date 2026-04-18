const express = require('express');
const router = express.Router();
const { sendReminders } = require('../services/whatsapp');

// POST /api/cron  — llamado por Vercel Cron Jobs
router.post('/', async (req, res) => {
  const secret = (req.headers['authorization'] || '').replace('Bearer ', '');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    await sendReminders();
    res.json({ ok: true, time: new Date().toISOString() });
  } catch (err) {
    console.error('[Cron] Error en sendReminders:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cron  — para que Vercel pueda verificar el endpoint
router.get('/', (req, res) => res.json({ status: 'Cron endpoint activo' }));

module.exports = router;
