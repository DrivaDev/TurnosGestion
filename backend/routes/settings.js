const express = require('express');
const router = express.Router();
const db = require('../database');
const { sendTest } = require('../services/whatsapp');

const SENSITIVE = ['twilio_auth_token'];

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    const all = await db.getAllSettings();
    for (const key of SENSITIVE) { if (all[key]) all[key] = '***masked***'; }
    delete all.schedule;
    res.json(all);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/settings
router.put('/', async (req, res) => {
  try {
    const allowed = [
      'business_name','reminder_minutes',
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
        return res.status(400).json({ error: 'reminder_minutes debe ser un número mayor a 0' });
      updates.reminder_minutes = String(mins);
    }
    // Store Twilio creds as env-like values in DB so serverless can read them
    if (updates.twilio_account_sid) process.env.TWILIO_ACCOUNT_SID = updates.twilio_account_sid;
    if (updates.twilio_auth_token)  process.env.TWILIO_AUTH_TOKEN  = updates.twilio_auth_token;
    if (updates.twilio_whatsapp_from) process.env.TWILIO_WHATSAPP_FROM = updates.twilio_whatsapp_from;

    await db.updateSettings(updates);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/settings/test-whatsapp
router.post('/test-whatsapp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Falta el campo phone' });
    res.json(await sendTest(phone));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
