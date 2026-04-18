// En desarrollo: el proxy de Vite redirige /api → localhost:3001
// En producción (Vercel): /api queda en el mismo dominio
const BASE = '/api';

async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res  = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error de servidor');
  return data;
}

export const api = {
  getAppointments:    (p = {}) => req('GET', `/appointments?${new URLSearchParams(p)}`),
  getAvailableSlots:  (date, excludeId) => req('GET', `/appointments/available-slots?date=${date}${excludeId ? `&excludeId=${excludeId}` : ''}`),
  createAppointment:  (data)  => req('POST',   '/appointments', data),
  updateAppointment:  (id, d) => req('PUT',    `/appointments/${id}`, d),
  deleteAppointment:  (id)    => req('DELETE', `/appointments/${id}`),
  resendConfirmation: (id)    => req('POST',   `/appointments/${id}/resend-confirmation`),

  getSchedule:        ()      => req('GET', '/schedule'),
  updateSchedule:     (data)  => req('PUT', '/schedule', data),
  getBlockedDays:     ()      => req('GET', '/schedule/blocked-days'),
  addBlockedDay:      (date)  => req('POST',   '/schedule/blocked-days', { date }),
  removeBlockedDay:   (date)  => req('DELETE', `/schedule/blocked-days/${date}`),

  getSettings:        ()      => req('GET', '/settings'),
  updateSettings:     (data)  => req('PUT', '/settings', data),
  testWhatsapp:       (phone) => req('POST', '/settings/test-whatsapp', { phone }),
};
