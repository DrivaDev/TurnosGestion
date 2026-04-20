const express = require('express');
const router  = express.Router();
const db      = require('../database');
const { sendConfirmation } = require('../services/email');
const { Service, Staff, Appointment } = require('../db/models');

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

const DAY_KEYS = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];

// GET /api/appointments/available-slots?date=YYYY-MM-DD&serviceId=X&staffId=Y
router.get('/available-slots', async (req, res) => {
  try {
    const tid = req.user.tenantId;
    const { date, excludeId, serviceId, staffId } = req.query;
    if (!date) return res.status(400).json({ error: 'Falta el parámetro date' });

    const blocked = await db.getBlockedDays(tid);
    if (blocked.includes(date)) return res.json({ slots: [], reason: 'día bloqueado' });

    const dayKey = DAY_KEYS[new Date(`${date}T12:00:00`).getDay()];

    // Resolve schedule: use staff's if provided and configured
    let dayConfig = null;
    let staffDaysOff = [];
    if (staffId && staffId !== 'undefined' && staffId !== 'null') {
      try {
        const sf = await Staff.findOne({ _id: staffId, tenantId: tid }).lean();
        if (sf) {
          staffDaysOff = sf.daysOff || [];
          if (sf.schedule) {
            const sfSchedule = JSON.parse(sf.schedule);
            if (sfSchedule[dayKey]) dayConfig = sfSchedule[dayKey];
          }
        }
      } catch (_) {}
    }
    if (staffDaysOff.includes(date)) return res.json({ slots: [], reason: 'día libre del profesional' });

    if (!dayConfig) {
      const schedule = JSON.parse(await db.getSetting(tid, 'schedule') || '{}');
      dayConfig = schedule[dayKey];
    }
    if (!dayConfig?.enabled) return res.json({ slots: [], reason: 'día no habilitado' });
    if (!dayConfig.start || !dayConfig.end) return res.json({ slots: [], reason: 'horario no configurado' });

    const slotDuration = 15;
    let serviceDuration = slotDuration;
    if (serviceId && serviceId !== 'undefined' && serviceId !== 'null') {
      try {
        const svc = await Service.findOne({ _id: serviceId, tenantId: tid, active: true });
        if (svc) serviceDuration = svc.durationMin;
      } catch (_) {}
    }

    const allSlots = generateSlots(dayConfig.start, dayConfig.end, slotDuration);
    const staffFilter = (staffId && staffId !== 'undefined' && staffId !== 'null') ? { staffId } : {};
    const taken = await Appointment.find({
      tenantId: tid, date, status: { $ne: 'cancelado' },
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
      ...staffFilter,
    }).lean();
    const takenTimes = new Set();
    for (const a of taken) {
      const dur = a.durationMin || slotDuration;
      const [ah, am] = a.time.split(':').map(Number);
      const startMin = ah * 60 + am;
      for (let cur = startMin; cur < startMin + dur; cur += slotDuration) {
        takenTimes.add(`${String(Math.floor(cur/60)).padStart(2,'0')}:${String(cur%60).padStart(2,'0')}`);
      }
    }

    const [eh, em] = dayConfig.end.split(':').map(Number);
    const slots = [];
    for (const t of allSlots) {
      const [h, m] = t.split(':').map(Number);
      const startMin = h * 60 + m;
      if (startMin + serviceDuration > eh * 60 + em) continue;
      let ok = true;
      for (let cur = startMin; cur < startMin + serviceDuration; cur += slotDuration) {
        const st = `${String(Math.floor(cur/60)).padStart(2,'0')}:${String(cur%60).padStart(2,'0')}`;
        if (takenTimes.has(st)) { ok = false; break; }
      }
      if (ok) slots.push(t);
    }
    res.json({ slots });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/appointments
router.get('/', async (req, res) => {
  try {
    const { date, month, status } = req.query;
    res.json(await db.getAppointments(req.user.tenantId, { date, month, status }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/appointments
router.post('/', async (req, res) => {
  try {
    const tid = req.user.tenantId;
    const { name, phone, email, date, time, notes, serviceId, staffId, sendEmail: doSend = true } = req.body;
    if (!name || !phone || !date || !time)
      return res.status(400).json({ error: 'Faltan campos: name, phone, date, time' });

    let serviceName = null, durationMin = null;
    if (serviceId) {
      try {
        const svc = await Service.findOne({ _id: serviceId, tenantId: tid, active: true });
        if (svc) { serviceName = svc.name; durationMin = svc.durationMin; }
      } catch (_) {}
    }

    let resolvedStaffId = null, staffName = null;
    if (staffId) {
      try {
        const sf = await Staff.findOne({ _id: staffId, tenantId: tid, active: true });
        if (sf) { resolvedStaffId = sf._id; staffName = sf.name; }
      } catch (_) {}
    }

    if (await db.isSlotTaken(tid, date, time, null, resolvedStaffId))
      return res.status(409).json({ error: 'El horario ya está ocupado' });

    const apt = await db.createAppointment(tid, { name, phone, email: email || null, date, time, notes, serviceName, durationMin, staffId: resolvedStaffId, staffName });
    const emailResult = doSend ? await sendConfirmation(tid, apt) : null;
    res.status(201).json({ appointment: apt, email: emailResult });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/appointments/:id
router.put('/:id', async (req, res) => {
  try {
    const tid = req.user.tenantId;
    const existing = await db.getAppointment(tid, req.params.id);
    if (!existing) return res.status(404).json({ error: 'Turno no encontrado' });

    const { name, phone, email, date, time, notes, status, sendEmail: doSend } = req.body;
    if (date && time && (date !== existing.date || time !== existing.time)) {
      if (await db.isSlotTaken(tid, date, time, req.params.id))
        return res.status(409).json({ error: 'El horario ya está ocupado' });
    }
    const updated = await db.updateAppointment(tid, req.params.id, { name, phone, email, date, time, notes, status });
    let emailResult = null;
    if (doSend) {
      await db.updateAppointment(tid, req.params.id, { confirmation_sent: 0 });
      emailResult = await sendConfirmation(tid, await db.getAppointment(tid, req.params.id));
    }
    res.json({ appointment: updated, email: emailResult });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req, res) => {
  try {
    const tid = req.user.tenantId;
    if (!(await db.getAppointment(tid, req.params.id)))
      return res.status(404).json({ error: 'Turno no encontrado' });
    await db.deleteAppointment(tid, req.params.id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/appointments/:id/resend-confirmation
router.post('/:id/resend-confirmation', async (req, res) => {
  try {
    const tid = req.user.tenantId;
    const apt = await db.getAppointment(tid, req.params.id);
    if (!apt) return res.status(404).json({ error: 'Turno no encontrado' });
    await db.updateAppointment(tid, apt.id, { confirmation_sent: 0 });
    const fresh = await db.getAppointment(tid, apt.id);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const cancelUrl = fresh.cancelToken ? `${baseUrl}/cancel/${fresh.cancelToken}` : null;
    res.json(await sendConfirmation(tid, fresh, { cancelUrl }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
