const { Config, Appointment } = require('./db/models');

const DEFAULT_SETTINGS = {
  reminder_minutes: '60',
  schedule: JSON.stringify({
    lunes:     { enabled: true,  start: '09:00', end: '18:00', slotDuration: 30 },
    martes:    { enabled: true,  start: '09:00', end: '18:00', slotDuration: 30 },
    miercoles: { enabled: true,  start: '09:00', end: '18:00', slotDuration: 30 },
    jueves:    { enabled: true,  start: '09:00', end: '18:00', slotDuration: 30 },
    viernes:   { enabled: true,  start: '09:00', end: '18:00', slotDuration: 30 },
    sabado:    { enabled: false, start: '09:00', end: '13:00', slotDuration: 30 },
    domingo:   { enabled: false, start: '09:00', end: '13:00', slotDuration: 30 },
  }),
  confirmation_message: '¡Hola {nombre}! ✅ Tu turno fue confirmado para el *{fecha}* a las *{hora}*. ¡Te esperamos!',
  reminder_message:     '¡Hola {nombre}! 🔔 Te recordamos que tenés un turno hoy a las *{hora}*. ¡No te olvides!',
  business_name: 'Mi Local',
};

async function getConfig() {
  let cfg = await Config.findById('main');
  if (!cfg) {
    cfg = await Config.create({ _id: 'main', settings: DEFAULT_SETTINGS, blocked_days: [] });
  }
  return cfg;
}

// ── Settings ──────────────────────────────────────────────────────────────────
async function getSetting(key) {
  const cfg = await getConfig();
  return cfg.settings.get(key) ?? DEFAULT_SETTINGS[key] ?? null;
}

async function setSetting(key, value) {
  await Config.findByIdAndUpdate(
    'main',
    { $set: { [`settings.${key}`]: String(value) } },
    { upsert: true }
  );
}

async function getAllSettings() {
  const cfg = await getConfig();
  const out = { ...DEFAULT_SETTINGS };
  cfg.settings.forEach((v, k) => { out[k] = v; });
  return out;
}

async function updateSettings(data) {
  const update = {};
  for (const [k, v] of Object.entries(data)) {
    update[`settings.${k}`] = String(v);
  }
  await Config.findByIdAndUpdate('main', { $set: update }, { upsert: true });
}

// ── Blocked Days ──────────────────────────────────────────────────────────────
async function getBlockedDays() {
  const cfg = await getConfig();
  return [...cfg.blocked_days].sort();
}

async function addBlockedDay(date) {
  await Config.findByIdAndUpdate('main', { $addToSet: { blocked_days: date } }, { upsert: true });
}

async function removeBlockedDay(date) {
  await Config.findByIdAndUpdate('main', { $pull: { blocked_days: date } });
}

// ── Appointments ──────────────────────────────────────────────────────────────
async function getAppointments({ date, month, status } = {}) {
  const q = {};
  if (date)   q.date = date;
  if (month)  q.date = { $regex: `^${month}` };
  if (status) q.status = status;
  return Appointment.find(q).sort({ date: 1, time: 1 }).lean({ virtuals: true });
}

async function getAppointment(id) {
  return Appointment.findById(id).lean({ virtuals: true });
}

async function createAppointment({ name, phone, date, time, notes }) {
  const apt = await Appointment.create({ name, phone, date, time, notes });
  return apt.toJSON();
}

async function updateAppointment(id, data) {
  const apt = await Appointment.findByIdAndUpdate(id, { $set: data }, { new: true });
  return apt ? apt.toJSON() : null;
}

async function deleteAppointment(id) {
  await Appointment.findByIdAndDelete(id);
}

async function isSlotTaken(date, time, excludeId = null) {
  const q = { date, time, status: { $ne: 'cancelado' } };
  if (excludeId) q._id = { $ne: excludeId };
  return !!(await Appointment.exists(q));
}

async function getPendingReminders() {
  const today = new Date().toISOString().slice(0, 10);
  return Appointment.find({
    reminder_sent: 0,
    status: { $ne: 'cancelado' },
    date: { $gte: today },
  }).lean({ virtuals: true });
}

async function markConfirmationSent(id) {
  await Appointment.findByIdAndUpdate(id, { confirmation_sent: 1 });
}

async function markReminderSent(id) {
  await Appointment.findByIdAndUpdate(id, { reminder_sent: 1 });
}

module.exports = {
  getSetting, setSetting, getAllSettings, updateSettings,
  getBlockedDays, addBlockedDay, removeBlockedDay,
  getAppointments, getAppointment, createAppointment,
  updateAppointment, deleteAppointment, isSlotTaken,
  getPendingReminders, markConfirmationSent, markReminderSent,
};
