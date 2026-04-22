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

function buildHtml({ businessName, heading, intro, apt, cancelUrl, footerNote }) {
  const rows = [
    { icon: '📅', label: 'Fecha',       value: formatDate(apt.date) },
    { icon: '🕐', label: 'Hora',        value: apt.time },
    apt.serviceName ? { icon: '✂️', label: 'Servicio',    value: apt.serviceName } : null,
    apt.staffName   ? { icon: '👤', label: 'Profesional', value: apt.staffName  } : null,
    { icon: '📋', label: 'Cliente',     value: apt.name  },
    apt.phone       ? { icon: '📞', label: 'Teléfono',    value: apt.phone      } : null,
  ].filter(Boolean);

  const detailRows = rows.map(r => `
    <tr>
      <td style="padding:8px 12px;color:#78716c;font-size:13px;white-space:nowrap;">
        ${r.icon} ${r.label}
      </td>
      <td style="padding:8px 12px;color:#1C1917;font-size:14px;font-weight:600;">
        ${r.value}
      </td>
    </tr>`).join('');

  const cancelBtn = cancelUrl ? `
    <div style="text-align:center;margin-top:24px;">
      <a href="${cancelUrl}"
        style="display:inline-block;padding:10px 24px;border-radius:10px;border:2px solid #FED7AA;color:#9A3412;font-size:13px;font-weight:600;text-decoration:none;">
        Cancelar mi turno
      </a>
    </div>` : '';

  const footerExtra = footerNote
    ? `<p style="margin:4px 0 0;font-size:12px;color:#d6d3d1;">${footerNote}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#FFF7ED;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF7ED;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#9A3412,#EA580C);border-radius:16px 16px 0 0;padding:36px 32px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:50%;width:48px;height:48px;line-height:48px;font-size:22px;margin-bottom:12px;">📆</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">${businessName}</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Reservas online</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px 32px;">
              <h2 style="margin:0 0 8px;color:#9A3412;font-size:20px;font-weight:700;">${heading}</h2>
              <p style="margin:0 0 24px;color:#57534e;font-size:15px;line-height:1.6;">${intro}</p>

              <!-- Appointment details card -->
              <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:12px;overflow:hidden;margin-bottom:24px;">
                <div style="background:#EA580C;padding:10px 16px;">
                  <span style="color:#fff;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Detalles del turno</span>
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  ${detailRows}
                </table>
              </div>

              ${cancelBtn}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="background:#ffffff;padding:0 32px;">
              <div style="border-top:1px solid #FED7AA;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#ffffff;border-radius:0 0 16px 16px;padding:20px 32px 28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a8a29e;">Este email fue enviado automáticamente. Por favor no respondas a este mensaje.</p>
              ${footerExtra}
              <p style="margin:12px 0 0;font-size:12px;color:#d6d3d1;">
                Gestionado con
                <a href="https://drivadev.com" style="color:#EA580C;font-weight:700;text-decoration:none;">Turnly</a>
                · Desarrollado por
                <a href="https://drivadev.com" style="color:#EA580C;font-weight:700;text-decoration:none;">Driva Dev</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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

async function sendEmail(tenantId, to, subject, text, html) {
  const transport = await createTransport(tenantId);
  if (!transport) {
    console.log(`[Email][tenant:${tenantId}] No configurado. Para: ${to}\n${text}`);
    return { ok: false, reason: 'email_not_configured' };
  }
  const emailFrom = await db.getSetting(tenantId, 'email_from');
  try {
    await transport.sendMail({ from: emailFrom, to, subject, text, html });
    return { ok: true };
  } catch (err) {
    console.error(`[Email][tenant:${tenantId}] Error:`, err.message);
    return { ok: false, reason: err.message };
  }
}

async function sendConfirmation(tenantId, apt, { cancelUrl, pendingConfirmation } = {}) {
  if (!apt.email) return { ok: false, reason: 'no_email' };
  const businessName = await db.getSetting(tenantId, 'business_name') || 'el negocio';

  let heading, intro, subject;

  if (pendingConfirmation) {
    const template = await db.getSetting(tenantId, 'confirmation_message')
      || 'Recibimos tu solicitud de turno en ' + businessName + '. Te avisaremos por email cuando el negocio lo confirme.';
    heading = '¡Solicitud recibida!';
    intro   = buildMessage(template, apt);
    subject = `Solicitud de turno recibida — ${businessName}`;
  } else {
    const template = await db.getSetting(tenantId, 'confirmation_message')
      || '¡Tu turno en ' + businessName + ' está confirmado! Guardá los datos para recordarlo.';
    heading = '¡Turno confirmado! ✅';
    intro   = buildMessage(template, apt);
    subject = `Confirmación de turno — ${businessName}`;
  }

  const text = `${heading}\n\n${intro}\n\nFecha: ${formatDate(apt.date)}\nHora: ${apt.time}${apt.serviceName ? '\nServicio: ' + apt.serviceName : ''}${apt.staffName ? '\nProfesional: ' + apt.staffName : ''}${cancelUrl ? '\n\nCancelar turno: ' + cancelUrl : ''}`;

  const html = buildHtml({
    businessName,
    heading,
    intro,
    apt,
    cancelUrl,
    footerNote: pendingConfirmation ? 'Tu turno quedará confirmado cuando el negocio lo apruebe.' : null,
  });

  const result = await sendEmail(tenantId, apt.email, subject, text, html);
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
      || '¡Te recordamos tu turno en ' + businessName + '! No te olvides de tu reserva.';
    const candidates = await db.getPendingReminders(tid);
    const now = new Date();

    for (const apt of candidates) {
      if (!apt.email) continue;
      const [h, m]       = apt.time.split(':').map(Number);
      const [yr, mo, dy] = apt.date.split('-').map(Number);
      const aptTime      = new Date(yr, mo - 1, dy, h, m);
      const minutesUntil = (aptTime - now) / 60000;
      if (minutesUntil >= 0 && minutesUntil <= reminderMinutes) {
        const intro = buildMessage(template, apt);
        const text  = `Recordatorio de turno\n\n${intro}\n\nFecha: ${formatDate(apt.date)}\nHora: ${apt.time}`;
        const html  = buildHtml({ businessName, heading: '🔔 Recordatorio de turno', intro, apt });
        const result = await sendEmail(tid, apt.email, `Recordatorio de turno — ${businessName}`, text, html);
        if (result.ok) await db.markReminderSent(tid, apt.id || apt._id?.toString());
      }
    }
  }
}

async function sendCancellation(tenantId, apt, { bookingUrl } = {}) {
  if (!apt.email) return { ok: false, reason: 'no_email' };
  const businessName = await db.getSetting(tenantId, 'business_name') || 'el negocio';

  const intro = `Tu turno en ${businessName} para el ${formatDate(apt.date)} a las ${apt.time} ha sido cancelado.`;

  const reactivateBtn = bookingUrl ? `
    <div style="text-align:center;margin-top:24px;">
      <a href="${bookingUrl}"
        style="display:inline-block;padding:12px 28px;border-radius:10px;background:linear-gradient(135deg,#EA580C,#F97316);color:#fff;font-size:14px;font-weight:700;text-decoration:none;">
        Reservar un nuevo turno
      </a>
    </div>
    <p style="text-align:center;margin-top:12px;font-size:13px;color:#78716c;">
      ¿Fue un error? Contactá al negocio para reactivar tu turno.
    </p>` : '';

  const html = buildHtml({
    businessName,
    heading: 'Turno cancelado',
    intro,
    apt,
    cancelUrl: null,
    footerNote: null,
  }).replace('</table>\n\n          ${cancelBtn}', `</table>${reactivateBtn}`);

  // Rebuild html with reactivate button instead of cancel button
  const rows = [
    { icon: '📅', label: 'Fecha',       value: formatDate(apt.date) },
    { icon: '🕐', label: 'Hora',        value: apt.time },
    apt.serviceName ? { icon: '✂️', label: 'Servicio',    value: apt.serviceName } : null,
    apt.staffName   ? { icon: '👤', label: 'Profesional', value: apt.staffName  } : null,
    { icon: '📋', label: 'Cliente',     value: apt.name  },
  ].filter(Boolean);

  const detailRows = rows.map(r => `
    <tr>
      <td style="padding:8px 12px;color:#78716c;font-size:13px;white-space:nowrap;">${r.icon} ${r.label}</td>
      <td style="padding:8px 12px;color:#1C1917;font-size:14px;font-weight:600;">${r.value}</td>
    </tr>`).join('');

  const fullHtml = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#FFF7ED;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF7ED;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="background:linear-gradient(135deg,#374151,#6b7280);border-radius:16px 16px 0 0;padding:36px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${businessName}</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Reservas online</p>
        </td></tr>
        <tr><td style="background:#ffffff;padding:36px 32px;">
          <h2 style="margin:0 0 8px;color:#374151;font-size:20px;font-weight:700;">Turno cancelado ❌</h2>
          <p style="margin:0 0 24px;color:#57534e;font-size:15px;line-height:1.6;">${intro}</p>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:24px;">
            <div style="background:#6b7280;padding:10px 16px;">
              <span style="color:#fff;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Turno cancelado</span>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${detailRows}</table>
          </div>
          ${reactivateBtn}
        </td></tr>
        <tr><td style="background:#ffffff;padding:0 32px;"><div style="border-top:1px solid #FED7AA;"></div></td></tr>
        <tr><td style="background:#ffffff;border-radius:0 0 16px 16px;padding:20px 32px 28px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#a8a29e;">Este email fue enviado automáticamente.</p>
          <p style="margin:12px 0 0;font-size:12px;color:#d6d3d1;">
            Gestionado con <a href="https://drivadev.com" style="color:#EA580C;font-weight:700;text-decoration:none;">Turnly</a>
            · Desarrollado por <a href="https://drivadev.com" style="color:#EA580C;font-weight:700;text-decoration:none;">Driva Dev</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = `Turno cancelado\n\n${intro}\n\nFecha: ${formatDate(apt.date)}\nHora: ${apt.time}${bookingUrl ? '\n\nReservar nuevo turno: ' + bookingUrl : ''}`;
  return sendEmail(tenantId, apt.email, `Turno cancelado — ${businessName}`, text, fullHtml);
}

async function sendTest(tenantId, email) {
  const businessName = await db.getSetting(tenantId, 'business_name') || 'Mi Local';
  const fakeApt = { name: 'Cliente de prueba', date: new Date().toISOString().slice(0,10), time: '10:00', serviceName: 'Servicio ejemplo', staffName: null, phone: null };
  const text = `✅ Email de prueba desde ${businessName}. ¡Configuración correcta!`;
  const html = buildHtml({ businessName, heading: '✅ Email de prueba', intro: 'La configuración de email está funcionando correctamente. ¡Todo listo para enviar confirmaciones a tus clientes!', apt: fakeApt });
  return sendEmail(tenantId, email, `Prueba de email — ${businessName}`, text, html);
}

module.exports = { sendConfirmation, sendCancellation, sendReminders, sendTest };
