const express = require('express');
const router = express.Router();
const db = require('../database');
const { sendConfirmation } = require('../services/whatsapp');

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

const DAY_KEYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

// GET /api/appointments/available-slots?date=YYYY-MM-DD
router.get('/available-slots', async (req, res) => {
  try {
    const { date, excludeId } = req.query;
    if (!date) return res.status(400).json({ error: 'Falta el parámetro date' });

    const blockedDays = await db.getBlockedDays();
    if (blockedDays.includes(date)) return res.json({ slots: [], reason: 'día bloqueado' });

    const dayKey = DAY_KEYS[new Date(`${date}T12:00:00`).getDay()];
    const schedule = JSON.parse(await db.getSetting('schedule') || '{}');
    const dayConfig = schedule[dayKey];
    if (!dayConfig?.enabled) return res.json({ slots: [], reason: 'día no habilitado' });

    const allSlots = generateSlots(dayConfig.start, dayConfig.end, dayConfig.slotDuration);
    const slots = [];
    for (const t of allSlots) {
      if (!(await db.isSlotTaken(date, t, excludeId || null))) slots.push(t);
    }
    res.json({ slots });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/appointments
router.get('/', async (req, res) => {
  try {
    const { date, month, status } = req.query;
    res.json(await db.getAppointments({ date, month, status }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/appointments/:id
router.get('/:id', async (req, res) => {
  try {
    const apt = await db.getAppointment(req.params.id);
    if (!apt) return res.status(404).json({ error: 'Turno no encontrado' });
    res.json(apt);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/appointments
router.post('/', async (req, res) => {
  try {
    const { name, phone, date, time, notes, sendWhatsapp = true } = req.body;
    if (!name || !phone || !date || !time)
      return res.status(400).json({ error: 'Faltan campos requeridos: name, phone, date, time' });
    if (await db.isSlotTaken(date, time))
      return res.status(409).json({ error: 'El horario ya está ocupado' });

    const apt = await db.createAppointment({ name, phone, date, time, notes });
    const whatsapp = sendWhatsapp ? await sendConfirmation(apt) : null;
    res.status(201).json({ appointment: apt, whatsapp });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/appointments/:id
router.put('/:id', async (req, res) => {
  try {
    const existing = await db.getAppointment(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Turno no encontrado' });

    const { name, phone, date, time, notes, status, sendWhatsapp } = req.body;
    if (date && time && (date !== existing.date || time !== existing.time)) {
      if (await db.isSlotTaken(date, time, req.params.id))
        return res.status(409).json({ error: 'El horario ya está ocupado' });
    }

    const updated = await db.updateAppointment(req.params.id, { name, phone, date, time, notes, status });
    let whatsapp = null;
    if (sendWhatsapp) {
      await db.updateAppointment(req.params.id, { confirmation_sent: 0 });
      whatsapp = await sendConfirmation(await db.getAppointment(req.params.id));
    }
    res.json({ appointment: updated, whatsapp });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req, res) => {
  try {
    if (!(await db.getAppointment(req.params.id)))
      return res.status(404).json({ error: 'Turno no encontrado' });
    await db.deleteAppointment(req.params.id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/appointments/:id/resend-confirmation
router.post('/:id/resend-confirmation', async (req, res) => {
  try {
    const apt = await db.getAppointment(req.params.id);
    if (!apt) return res.status(404).json({ error: 'Turno no encontrado' });
    await db.updateAppointment(apt.id, { confirmation_sent: 0 });
    const result = await sendConfirmation(await db.getAppointment(apt.id));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
