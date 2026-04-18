const express = require('express');
const router  = express.Router();
const { Tenant } = require('../db/models');
const db = require('../database');
const { sendConfirmation } = require('../services/whatsapp');

const DAY_KEYS = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];

function generateSlots(start, end, durationMin) {
  const slots = [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let cur = sh * 60 + sm;
  const endMin = eh * 60 + em;
  while (cur + durationMin <= endMin) {
    slots.push(`${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`);
    cur += durationMin;
  }
  return slots;
}

// GET /api/public/:slug — info del negocio para la página de reservas
router.get('/:slug', async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.params.slug });
    if (!tenant) return res.status(404).json({ error: 'Negocio no encontrado' });

    const tid = tenant._id;
    const settings = await db.getAllSettings(tid);

    res.json({
      businessName:        settings.business_name || tenant.name,
      businessDescription: settings.business_description || '',
      slug:                tenant.slug,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/public/:slug/slots?date=YYYY-MM-DD — horarios disponibles
router.get('/:slug/slots', async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.params.slug });
    if (!tenant) return res.status(404).json({ error: 'Negocio no encontrado' });

    const tid  = tenant._id;
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Falta el parámetro date' });

    const blocked = await db.getBlockedDays(tid);
    if (blocked.includes(date)) return res.json({ slots: [], reason: 'día bloqueado' });

    const dayKey    = DAY_KEYS[new Date(`${date}T12:00:00`).getDay()];
    const schedule  = JSON.parse(await db.getSetting(tid, 'schedule') || '{}');
    const dayConfig = schedule[dayKey];
    if (!dayConfig?.enabled) return res.json({ slots: [], reason: 'día no habilitado' });

    const allSlots = generateSlots(dayConfig.start, dayConfig.end, dayConfig.slotDuration);
    const slots = [];
    for (const t of allSlots) {
      if (!(await db.isSlotTaken(tid, date, t))) slots.push(t);
    }
    res.json({ slots });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/public/:slug/book — reservar turno
router.post('/:slug/book', async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.params.slug });
    if (!tenant) return res.status(404).json({ error: 'Negocio no encontrado' });

    const tid = tenant._id;
    const { name, phone, date, time, notes } = req.body;
    if (!name || !phone || !date || !time)
      return res.status(400).json({ error: 'Faltan campos requeridos' });

    // Validate phone format
    const cleanPhone = phone.replace(/\s/g, '');
    if (!/^\+?\d{8,15}$/.test(cleanPhone))
      return res.status(400).json({ error: 'Formato de teléfono inválido. Incluí el código de país. Ej: +5491122334455' });

    if (await db.isSlotTaken(tid, date, time))
      return res.status(409).json({ error: 'Este horario ya fue reservado. Por favor elegí otro.' });

    const apt = await db.createAppointment(tid, { name, phone: cleanPhone, date, time, notes, source: 'web' });
    const whatsapp = await sendConfirmation(tid, apt);

    res.status(201).json({
      ok: true,
      appointment: { name: apt.name, date: apt.date, time: apt.time },
      whatsapp,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
