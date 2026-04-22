const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const { Tenant, Service, Appointment, Staff } = require('../db/models');
const db = require('../database');
const { sendConfirmation, sendCancellation } = require('../services/email');

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

// GET /api/public/:slug/staff?serviceId=X — staff disponibles para un servicio
router.get('/:slug/staff', async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.params.slug });
    const check = tenantStatus(tenant);
    if (!check.ok) return res.status(check.status).json({ error: check.error });

    const { serviceId } = req.query;
    const query = { tenantId: tenant._id, active: true };
    if (serviceId && serviceId !== 'undefined' && serviceId !== 'null') {
      query.serviceIds = serviceId;
    }
    let docs = await Staff.find(query).sort({ order: 1, createdAt: 1 }).lean();
    if (docs.length === 0 && serviceId && serviceId !== 'undefined' && serviceId !== 'null') {
      docs = await Staff.find({ tenantId: tenant._id, active: true }).sort({ order: 1, createdAt: 1 }).lean();
    }
    res.json(docs.map(s => ({ ...s, id: s._id.toString(), _id: undefined })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/public/:slug — info del negocio para la página de reservas
router.get('/:slug', async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.params.slug });
    const check = tenantStatus(tenant);
    if (!check.ok) return res.status(check.status).json({ error: check.error, message: check.message });

    const tid = tenant._id;
    const settings = await db.getAllSettings(tid);

    const servicesDocs = await Service.find({ tenantId: tenant._id, active: true }).sort({ createdAt: 1 }).lean();
    const services = servicesDocs.map(s => ({ ...s, id: s._id.toString(), _id: undefined }));

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

    const dayKey = DAY_KEYS[new Date(`${date}T12:00:00`).getDay()];

    // Resolve schedule: use staff's if provided and configured
    let dayConfig = null;
    let staffDaysOff = [];
    const { staffId } = req.query;
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

    // If a service is specified, use its duration; otherwise use the slot interval
    let serviceDuration = slotDuration;
    const { serviceId } = req.query;
    if (serviceId && serviceId !== 'undefined' && serviceId !== 'null') {
      try {
        const svc = await Service.findOne({ _id: serviceId, tenantId: tid, active: true });
        if (svc) serviceDuration = svc.durationMin;
      } catch (_) { /* invalid id format, use default */ }
    }

    // All possible start times (every slotDuration minutes)
    const allSlots = generateSlots(dayConfig.start, dayConfig.end, slotDuration);

    // Filter appointments by staffId if provided (each staff member has independent slots)
    const staffFilter = (staffId && staffId !== 'undefined' && staffId !== 'null') ? { staffId } : {};
    const taken = await Appointment.find({
      tenantId: tid, date, status: { $ne: 'cancelado' }, ...staffFilter,
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
    const { name, phone, email, date, time, notes, serviceId, staffId } = req.body;
    if (!name || !phone || !date || !time)
      return res.status(400).json({ error: 'Faltan campos requeridos' });

    const cleanPhone = phone.replace(/\s/g, '');
    if (!/^\+?\d{8,15}$/.test(cleanPhone))
      return res.status(400).json({ error: 'Formato de teléfono inválido. Incluí el código de país. Ej: +5491122334455' });

    // Resolve service
    let resolvedServiceId = null, serviceName = null, durationMin = null;
    if (serviceId && serviceId !== 'undefined') {
      try {
        const svc = await Service.findOne({ _id: serviceId, tenantId: tid, active: true });
        if (svc) { resolvedServiceId = svc._id; serviceName = svc.name; durationMin = svc.durationMin; }
      } catch (_) {}
    }

    // Resolve staff
    let resolvedStaffId = null, staffName = null;
    if (staffId && staffId !== 'undefined') {
      try {
        const sf = await Staff.findOne({ _id: staffId, tenantId: tid, active: true });
        if (sf) { resolvedStaffId = sf._id; staffName = sf.name; }
      } catch (_) {}
    }

    // Check all required slots are free (per staff if specified)
    const slotDuration = 15;
    const blocksNeeded = durationMin ? Math.ceil(durationMin / slotDuration) : 1;
    const [h, m] = time.split(':').map(Number);
    const startMin = h * 60 + m;
    for (let i = 0; i < blocksNeeded; i++) {
      const blockMin  = startMin + i * slotDuration;
      const blockTime = `${String(Math.floor(blockMin / 60)).padStart(2,'0')}:${String(blockMin % 60).padStart(2,'0')}`;
      if (await db.isSlotTaken(tid, date, blockTime, null, resolvedStaffId))
        return res.status(409).json({ error: 'Este horario ya fue reservado. Por favor elegí otro.' });
    }

    const requireConf = (await db.getSetting(tid, 'require_confirmation')) === 'true';
    const cancelToken = crypto.randomBytes(32).toString('hex');
    const status = requireConf ? 'pendiente' : 'confirmado';

    const apt = await db.createAppointment(tid, { name, phone: cleanPhone, email: email || null, date, time, notes, serviceId: resolvedServiceId, serviceName, durationMin, staffId: resolvedStaffId, staffName, source: 'web', cancelToken, status });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const cancelUrl = `${baseUrl}/cancel/${cancelToken}`;
    const emailResult = await sendConfirmation(tid, apt, { cancelUrl, pendingConfirmation: requireConf });

    res.status(201).json({
      ok: true,
      pendingConfirmation: requireConf,
      appointment: { name: apt.name, date: apt.date, time: apt.time },
      email: emailResult,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/public/cancel/:token — cancelar turno desde email
router.post('/cancel/:token', async (req, res) => {
  try {
    const apt = await db.getAppointmentByToken(req.params.token);
    if (!apt) return res.status(404).json({ error: 'Enlace inválido o expirado.' });
    if (apt.status === 'cancelado') return res.json({ ok: true, alreadyCancelled: true });
    await db.updateAppointment(apt.tenantId, apt.id, { status: 'cancelado' });
    const tenant = await Tenant.findById(apt.tenantId).lean();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const bookingUrl = tenant?.slug ? `${baseUrl}/book/${tenant.slug}` : null;
    await sendCancellation(apt.tenantId, apt, { bookingUrl });
    res.json({ ok: true, alreadyCancelled: false, name: apt.name, date: apt.date, time: apt.time });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
