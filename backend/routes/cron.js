const express = require('express');
const router  = express.Router();
const { sendReminders } = require('../services/whatsapp');

// Llamado por Vercel Cron Jobs — corre recordatorios para TODOS los tenants
router.post('/', async (req, res) => {
  const secret = (req.headers['authorization'] || '').replace('Bearer ', '');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET)
    return res.status(401).json({ error: 'Unauthorized' });
  try {
    await sendReminders();
    res.json({ ok: true, time: new Date().toISOString() });
  } catch (err) {
    console.error('[Cron]', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', (_, res) => res.json({ status: 'Cron endpoint activo' }));

module.exports = router;
