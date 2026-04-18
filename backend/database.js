const { Config, Appointment, Tenant } = require('./db/models');

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
  business_description: '',
  theme_primary:   '#EA580C',
  theme_secondary: '#9A3412',
  theme_accent:    '#FED7AA',
  theme_bg:        '#FFF7ED',
  theme_logo:      '',
};

async function getConfig(tenantId) {
  let cfg = await Config.findById(tenantId);
  if (!cfg) cfg = await Config.create({ _id: tenantId, settings: DEFAULT_SETTINGS });
  return cfg;
}

async function getSetting(tenantId, key) {
  const cfg = await getConfig(tenantId);
  return cfg.settings.get(key) ?? DEFAULT_SETTINGS[key] ?? null;
}

async function getAllSettings(tenantId) {
  const cfg = await getConfig(tenantId);
  const out = { ...DEFAULT_SETTINGS };
  cfg.settings.forEach((v, k) => { out[k] = v; });
  return out;
}

async function updateSettings(tenantId, data) {
  const update = {};
  for (const [k, v] of Object.entries(data)) update[`settings.${k}`] = String(v);
  await Config.findByIdAndUpdate(tenantId, { $set: update }, { upsert: true });
}

async function initTenantConfig(tenantId, businessName) {
  await Config.findByIdAndUpdate(
    tenantId,
    { $setOnInsert: { _id: tenantId, settings: { ...DEFAULT_SETTINGS, business_name: businessName }, blocked_days: [] } },
    { upsert: true }
  );
}

async function getBlockedDays(tenantId) {
  const cfg = await getConfig(tenantId);
  return [...cfg.blocked_days].sort();
}

async function addBlockedDay(tenantId, date) {
  await Config.findByIdAndUpdate(tenantId, { $addToSet: { blocked_days: date } }, { upsert: true });
}

async function removeBlockedDay(tenantId, date) {
  await Config.findByIdAndUpdate(tenantId, { $pull: { blocked_days: date } });
}

async function getAppointments(tenantId, { date, month, status } = {}) {
  const q = { tenantId };
  if (date)   q.date = date;
  if (month)  q.date = { $regex: `^${month}` };
  if (status) q.status = status;
  return Appointment.find(q).sort({ date: 1, time: 1 }).lean({ virtuals: true });
}

async function getAppointment(tenantId, id) {
  return Appointment.findOne({ _id: id, tenantId }).lean({ virtuals: true });
}

async function createAppointment(tenantId, { name, phone, date, time, notes, source = 'admin' }) {
  const apt = await Appointment.create({ tenantId, name, phone, date, time, notes, source });
  return apt.toJSON();
}

async function updateAppointment(tenantId, id, data) {
  const apt = await Appointment.findOneAndUpdate({ _id: id, tenantId }, { $set: data }, { new: true });
  return apt ? apt.toJSON() : null;
}

async function deleteAppointment(tenantId, id) {
  await Appointment.findOneAndDelete({ _id: id, tenantId });
}

async function isSlotTaken(tenantId, date, time, excludeId = null) {
  const q = { tenantId, date, time, status: { $ne: 'cancelado' } };
  if (excludeId) q._id = { $ne: excludeId };
  return !!(await Appointment.exists(q));
}

async function getPendingReminders(tenantId) {
  const today = new Date().toISOString().slice(0, 10);
  return Appointment.find({
    tenantId, reminder_sent: 0, status: { $ne: 'cancelado' }, date: { $gte: today },
  }).lean({ virtuals: true });
}

async function getAllTenants() {
  return Tenant.find({}).lean();
}

async function markConfirmationSent(tenantId, id) {
  await Appointment.findOneAndUpdate({ _id: id, tenantId }, { confirmation_sent: 1 });
}

async function markReminderSent(tenantId, id) {
  await Appointment.findOneAndUpdate({ _id: id, tenantId }, { reminder_sent: 1 });
}

module.exports = {
  getSetting, getAllSettings, updateSettings, initTenantConfig,
  getBlockedDays, addBlockedDay, removeBlockedDay,
  getAppointments, getAppointment, createAppointment,
  updateAppointment, deleteAppointment, isSlotTaken,
  getPendingReminders, getAllTenants,
  markConfirmationSent, markReminderSent,
};
