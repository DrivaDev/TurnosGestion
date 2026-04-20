const nodemailer = require('nodemailer');
const db = require('../database');

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const days = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${days[d.getDay()]} ${day} de ${months[month - 1]}`;
}

function buildMessage(template, apt) {
  return template
    .replace(/\{nombre\}/g, apt.name)
    .replace(/\{fecha\}/g, formatDate(apt.date))
    .replace(/\{hora\}/g, apt.time);
}

async function createTransport(tenantId) {
  const emailFrom     = await db.getSetting(tenantId, 'email_from');
  const emailPassword = await db.getSetting(tenantId, 'email_password');
  if (!emailFrom || !emailPassword) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: emailFrom, pass: emailPassword },
  });
}

async function sendEmail(tenantId, to, subject, text) {
  const transport = await createTransport(tenantId);
  if (!transport) {
    console.log(`[Email][tenant:${tenantId}] No configurado. Para: ${to}\n${text}`);
    return { ok: false, reason: 'email_not_configured' };
  }
  const emailFrom = await db.getSetting(tenantId, 'email_from');
  try {
    await transport.sendMail({ from: emailFrom, to, subject, text });
    return { ok: true };
  } catch (err) {
    console.error(`[Email][tenant:${tenantId}] Error:`, err.message);
    return { ok: false, reason: err.message };
  }
}

async function sendConfirmation(tenantId, apt, { cancelUrl, pendingConfirmation } = {}) {
  if (!apt.email) return { ok: false, reason: 'no_email' };
  const businessName = await db.getSetting(tenantId, 'business_name') || 'el negocio';

  let body;
  if (pendingConfirmation) {
    const template = await db.getSetting(tenantId, 'confirmation_message')
      || '¡Hola {nombre}! Recibimos tu solicitud de turno en ' + businessName + ' para el {fecha} a las {hora}. Te avisaremos cuando sea confirmado.';
    body = buildMessage(template, apt);
  } else {
    const template = await db.getSetting(tenantId, 'confirmation_message')
      || '¡Hola {nombre}! Tu turno en ' + businessName + ' fue confirmado para el {fecha} a las {hora}. ¡Te esperamos!';
    body = buildMessage(template, apt);
  }

  if (cancelUrl) {
    body += `\n\nSi necesitás cancelar tu turno, hacé clic aquí:\n${cancelUrl}`;
  }

  const subject = pendingConfirmation
    ? `Solicitud de turno recibida — ${businessName}`
    : `Confirmación de turno — ${businessName}`;

  const result = await sendEmail(tenantId, apt.email, subject, body);
  if (result.ok) await db.markConfirmationSent(tenantId, apt.id || apt._id?.toString());
  return result;
}

async function sendReminders() {
  const tenants = await db.getAllTenants();
  for (const tenant of tenants) {
    const tid = tenant._id;
    const reminderMinutes = parseInt(await db.getSetting(tid, 'reminder_minutes') || '60', 10);
    const businessName = await db.getSetting(tid, 'business_name') || 'el negocio';
    const template = await db.getSetting(tid, 'reminder_message')
      || '¡Hola {nombre}! Te recordamos que tenés un turno en ' + businessName + ' el {fecha} a las {hora}.';
    const candidates = await db.getPendingReminders(tid);
    const now = new Date();

    for (const apt of candidates) {
      if (!apt.email) continue;
      const [h, m]       = apt.time.split(':').map(Number);
      const [yr, mo, dy] = apt.date.split('-').map(Number);
      const aptTime      = new Date(yr, mo - 1, dy, h, m);
      const minutesUntil = (aptTime - now) / 60000;
      if (minutesUntil >= 0 && minutesUntil <= reminderMinutes) {
        const result = await sendEmail(tid, apt.email, `Recordatorio de turno — ${businessName}`, buildMessage(template, apt));
        if (result.ok) await db.markReminderSent(tid, apt.id || apt._id?.toString());
      }
    }
  }
}

async function sendTest(tenantId, email) {
  const businessName = await db.getSetting(tenantId, 'business_name') || 'Mi Local';
  return sendEmail(tenantId, email, `Prueba de email — ${businessName}`, `✅ Email de prueba desde ${businessName}. ¡Configuración correcta!`);
}

module.exports = { sendConfirmation, sendReminders, sendTest };
