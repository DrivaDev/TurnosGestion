const express = require('express');
const router  = express.Router();
const db      = require('../database');
const { sendTest } = require('../services/whatsapp');

const SENSITIVE = ['twilio_auth_token'];

router.get('/', async (req, res) => {
  try {
    const all = await db.getAllSettings(req.user.tenantId);
    for (const key of SENSITIVE) { if (all[key]) all[key] = '***masked***'; }
    delete all.schedule;
    res.json(all);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/', async (req, res) => {
  try {
    const allowed = [
      'business_name','business_description','reminder_minutes',
      'confirmation_message','reminder_message',
      'twilio_account_sid','twilio_auth_token','twilio_whatsapp_from',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] === undefined) continue;
      if (SENSITIVE.includes(key) && req.body[key] === '***masked***') continue;
      updates[key] = req.body[key];
    }
    if (updates.reminder_minutes !== undefined) {
      const mins = Number(updates.reminder_minutes);
      if (isNaN(mins) || mins < 1)
        return res.status(400).json({ error: 'reminder_minutes debe ser mayor a 0' });
      updates.reminder_minutes = String(mins);
    }
    await db.updateSettings(req.user.tenantId, updates);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/test-whatsapp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Falta el campo phone' });
    res.json(await sendTest(req.user.tenantId, phone));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
