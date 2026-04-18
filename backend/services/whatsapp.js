const db = require('../database');

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken || accountSid.startsWith('AC' + 'x')) return null;
  try { return require('twilio')(accountSid, authToken); } catch { return null; }
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
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

async function sendWhatsApp(to, body) {
  const client = getTwilioClient();
  if (!client) {
    console.log(`[WhatsApp] No configurado. Mensaje para ${to}:\n${body}`);
    return { ok: false, reason: 'twilio_not_configured' };
  }
  const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  try {
    const msg = await client.messages.create({ from, to: toNumber, body });
    console.log(`[WhatsApp] Enviado a ${to}: ${msg.sid}`);
    return { ok: true, sid: msg.sid };
  } catch (err) {
    console.error(`[WhatsApp] Error:`, err.message);
    return { ok: false, reason: err.message };
  }
}

async function sendConfirmation(apt) {
  const template = await db.getSetting('confirmation_message')
    || '¡Hola {nombre}! ✅ Tu turno fue confirmado para el *{fecha}* a las *{hora}*.';
  const result = await sendWhatsApp(apt.phone, buildMessage(template, apt));
  if (result.ok) await db.markConfirmationSent(apt.id);
  return result;
}

async function sendReminders() {
  const reminderMinutes = parseInt(await db.getSetting('reminder_minutes') || '60', 10);
  const template = await db.getSetting('reminder_message')
    || '¡Hola {nombre}! 🔔 Te recordamos que tenés un turno hoy a las *{hora}*.';

  const candidates = await db.getPendingReminders();
  const now = new Date();

  for (const apt of candidates) {
    const [h, m]      = apt.time.split(':').map(Number);
    const [yr, mo, dy] = apt.date.split('-').map(Number);
    const aptTime      = new Date(yr, mo - 1, dy, h, m);
    const minutesUntil = (aptTime - now) / 60000;

    if (minutesUntil >= 0 && minutesUntil <= reminderMinutes) {
      const result = await sendWhatsApp(apt.phone, buildMessage(template, apt));
      if (result.ok) await db.markReminderSent(apt.id);
    }
  }
}

async function sendTest(phone) {
  const businessName = await db.getSetting('business_name') || 'Mi Local';
  return sendWhatsApp(phone, `✅ Mensaje de prueba desde ${businessName}. ¡WhatsApp configurado correctamente!`);
}

module.exports = { sendConfirmation, sendReminders, sendTest, sendWhatsApp };
