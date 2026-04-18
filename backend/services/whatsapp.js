const db = require('../database');

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d      = new Date(year, month - 1, day);
  const days   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${days[d.getDay()]} ${day} de ${months[month - 1]}`;
}

function buildMessage(template, apt) {
  return template
    .replace(/\{nombre\}/g, apt.name)
    .replace(/\{fecha\}/g,  formatDate(apt.date))
    .replace(/\{hora\}/g,   apt.time);
}

async function getClient(tenantId) {
  const accountSid = await db.getSetting(tenantId, 'twilio_account_sid');
  const authToken  = await db.getSetting(tenantId, 'twilio_auth_token');
  const from       = await db.getSetting(tenantId, 'twilio_whatsapp_from') || 'whatsapp:+14155238886';
  if (!accountSid || !authToken || accountSid.includes('xxx')) return { client: null, from };
  try { return { client: require('twilio')(accountSid, authToken), from }; }
  catch { return { client: null, from }; }
}

async function sendWhatsApp(tenantId, to, body) {
  const { client, from } = await getClient(tenantId);
  if (!client) {
    console.log(`[WhatsApp][tenant:${tenantId}] No configurado. Mensaje para ${to}:\n${body}`);
    return { ok: false, reason: 'twilio_not_configured' };
  }
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  try {
    const msg = await client.messages.create({ from, to: toNumber, body });
    return { ok: true, sid: msg.sid };
  } catch (err) {
    console.error(`[WhatsApp][tenant:${tenantId}] Error:`, err.message);
    return { ok: false, reason: err.message };
  }
}

async function sendConfirmation(tenantId, apt) {
  const template = await db.getSetting(tenantId, 'confirmation_message')
    || '¡Hola {nombre}! ✅ Tu turno fue confirmado para el *{fecha}* a las *{hora}*.';
  const result = await sendWhatsApp(tenantId, apt.phone, buildMessage(template, apt));
  if (result.ok) await db.markConfirmationSent(tenantId, apt.id);
  return result;
}

// Corre para TODOS los tenants (llamado por el cron)
async function sendReminders() {
  const tenants = await db.getAllTenants();
  for (const tenant of tenants) {
    const tid = tenant._id;
    const reminderMinutes = parseInt(await db.getSetting(tid, 'reminder_minutes') || '60', 10);
    const template = await db.getSetting(tid, 'reminder_message')
      || '¡Hola {nombre}! 🔔 Te recordamos que tenés un turno hoy a las *{hora}*.';
    const candidates = await db.getPendingReminders(tid);
    const now = new Date();

    for (const apt of candidates) {
      const [h, m]       = apt.time.split(':').map(Number);
      const [yr, mo, dy] = apt.date.split('-').map(Number);
      const aptTime      = new Date(yr, mo - 1, dy, h, m);
      const minutesUntil = (aptTime - now) / 60000;
      if (minutesUntil >= 0 && minutesUntil <= reminderMinutes) {
        const result = await sendWhatsApp(tid, apt.phone, buildMessage(template, apt));
        if (result.ok) await db.markReminderSent(tid, apt.id);
      }
    }
  }
}

async function sendTest(tenantId, phone) {
  const businessName = await db.getSetting(tenantId, 'business_name') || 'Mi Local';
  return sendWhatsApp(tenantId, phone, `✅ Mensaje de prueba desde ${businessName}. ¡WhatsApp configurado correctamente!`);
}

module.exports = { sendConfirmation, sendReminders, sendTest };
