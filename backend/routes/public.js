const express = require('express');
const router  = express.Router();
const { Tenant, Service, Appointment } = require('../db/models');
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

function tenantStatus(tenant) {
  if (!tenant) return { ok: false, status: 404, error: 'Negocio no encontrado' };
  if (!tenant.active) return { ok: false, status: 410, error: 'inactive', message: 'Este negocio no está disponible en este momento.' };
  if (!tenant.approved) return { ok: false, status: 503, error: 'pending', message: 'Este negocio aún no ha sido activado.' };
  return { ok: true };
}

// GET /api/public/:slug — info del negocio para la página de reservas
router.get('/:slug', async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.params.slug });
    const check = tenantStatus(tenant);
    if (!check.ok) return res.status(check.status).json({ error: check.error, message: check.message });

    const tid = tenant._id;
    const settings = await db.getAllSettings(tid);

    const services = await Service.find({ tenantId: tenant._id, active: true }).sort({ createdAt: 1 }).lean({ virtuals: true });

    res.json({
      businessName:        settings.business_name || tenant.name,
      businessDescription: settings.business_description || '',
      slug:                tenant.slug,
      services,
      theme: {
        primary:   settings.theme_primary   || '#EA580C',
        secondary: settings.theme_secondary || '#9A3412',
        accent:    settings.theme_accent    || '#FED7AA',
        bg:        settings.theme_bg        || '#FFF7ED',
        logo:      settings.theme_logo      || '',
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/public/:slug/slots?date=YYYY-MM-DD — horarios disponibles
router.get('/:slug/slots', async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.params.slug });
    const check = tenantStatus(tenant);
    if (!check.ok) return res.status(check.status).json({ error: check.error });

    const tid  = tenant._id;
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Falta el parámetro date' });

    const blocked = await db.getBlockedDays(tid);
    if (blocked.includes(date)) return res.json({ slots: [], reason: 'día bloqueado' });

    const dayKey    = DAY_KEYS[new Date(`${date}T12:00:00`).getDay()];
    const schedule  = JSON.parse(await db.getSetting(tid, 'schedule') || '{}');
    const dayConfig = schedule[dayKey];
    if (!dayConfig?.enabled) return res.json({ slots: [], reason: 'día no habilitado' });

    const slotDuration = dayConfig.slotDuration || 30;

    // If a service is specified, use its duration; otherwise use the slot interval
    let serviceDuration = slotDuration;
    const { serviceId } = req.query;
    if (serviceId) {
      const svc = await Service.findOne({ _id: serviceId, tenantId: tid, active: true });
      if (svc) serviceDuration = svc.durationMin;
    }

    // All possible start times (every slotDuration minutes)
    const allSlots = generateSlots(dayConfig.start, dayConfig.end, slotDuration);

    // Get all taken appointments for that day to check consecutive slot availability
    const taken = await Appointment.find({
      tenantId: tid, date, status: { $ne: 'cancelado' },
    }).lean();
    const takenTimes = new Set(taken.map(a => a.time));

    // For each slot, check if all required consecutive time blocks are free
    const slots = [];
    for (const t of allSlots) {
      const [h, m] = t.split(':').map(Number);
      const startMin = h * 60 + m;
      const endMin   = startMin + serviceDuration;

      // Must fit within the working day
      const [eh, em] = dayConfig.end.split(':').map(Number);
      if (endMin > eh * 60 + em) continue;

      // All slot intervals within the service duration must be free
      let available = true;
      for (let cur = startMin; cur < endMin; cur += slotDuration) {
        const slotTime = `${String(Math.floor(cur / 60)).padStart(2,'0')}:${String(cur % 60).padStart(2,'0')}`;
        if (takenTimes.has(slotTime)) { available = false; break; }
      }
      if (available) slots.push(t);
    }

    res.json({ slots });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/public/:slug/book — reservar turno
router.post('/:slug/book', async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.params.slug });
    const check = tenantStatus(tenant);
    if (!check.ok) return res.status(check.status).json({ error: check.error });

    const tid = tenant._id;
    const { name, phone, date, time, notes, serviceId } = req.body;
    if (!name || !phone || !date || !time)
      return res.status(400).json({ error: 'Faltan campos requeridos' });

    const cleanPhone = phone.replace(/\s/g, '');
    if (!/^\+?\d{8,15}$/.test(cleanPhone))
      return res.status(400).json({ error: 'Formato de teléfono inválido. Incluí el código de país. Ej: +5491122334455' });

    // Resolve service
    let serviceName = null, durationMin = null;
    if (serviceId) {
      const svc = await Service.findOne({ _id: serviceId, tenantId: tid, active: true });
      if (svc) { serviceName = svc.name; durationMin = svc.durationMin; }
    }

    // Check all required slots are free
    const settings  = await db.getAllSettings(tid);
    const schedule  = JSON.parse(settings.schedule || '{}');
    const dayKey    = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'][new Date(`${date}T12:00:00`).getDay()];
    const slotDuration = schedule[dayKey]?.slotDuration || 30;
    const blocksNeeded = durationMin ? Math.ceil(durationMin / slotDuration) : 1;

    const [h, m] = time.split(':').map(Number);
    const startMin = h * 60 + m;
    for (let i = 0; i < blocksNeeded; i++) {
      const blockMin  = startMin + i * slotDuration;
      const blockTime = `${String(Math.floor(blockMin / 60)).padStart(2,'0')}:${String(blockMin % 60).padStart(2,'0')}`;
      if (await db.isSlotTaken(tid, date, blockTime))
        return res.status(409).json({ error: 'Este horario ya fue reservado. Por favor elegí otro.' });
    }

    const apt = await db.createAppointment(tid, { name, phone: cleanPhone, date, time, notes, serviceName, durationMin, source: 'web' });
    const whatsapp = await sendConfirmation(tid, apt);

    res.status(201).json({
      ok: true,
      appointment: { name: apt.name, date: apt.date, time: apt.time },
      whatsapp,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
