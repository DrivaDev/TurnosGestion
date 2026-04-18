const BASE = '/api';

function getToken() { return localStorage.getItem('token'); }

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res  = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Sesión expirada');
  }
  if (!res.ok) throw new Error(data.error || 'Error de servidor');
  return data;
}

export const api = {
  // Auth
  login:              (data)  => req('POST', '/auth/login', data),
  register:           (data)  => req('POST', '/auth/register', data),
  me:                 ()      => req('GET',  '/auth/me'),

  // Appointments
  getAppointments:    (p = {}) => req('GET', `/appointments?${new URLSearchParams(p)}`),
  getAvailableSlots:  (date, excludeId, extra = '') => req('GET', `/appointments/available-slots?date=${date}${excludeId ? `&excludeId=${excludeId}` : ''}${extra}`),
  createAppointment:  (data)  => req('POST',   '/appointments', data),
  updateAppointment:  (id, d) => req('PUT',    `/appointments/${id}`, d),
  deleteAppointment:  (id)    => req('DELETE', `/appointments/${id}`),
  resendConfirmation: (id)    => req('POST',   `/appointments/${id}/resend-confirmation`),

  // Schedule
  getSchedule:        ()      => req('GET', '/schedule'),
  updateSchedule:     (data)  => req('PUT', '/schedule', data),
  getBlockedDays:     ()      => req('GET', '/schedule/blocked-days'),
  addBlockedDay:      (date)  => req('POST',   '/schedule/blocked-days', { date }),
  removeBlockedDay:   (date)  => req('DELETE', `/schedule/blocked-days/${date}`),

  // Settings
  getSettings:        ()      => req('GET', '/settings'),
  updateSettings:     (data)  => req('PUT', '/settings', data),
  testWhatsapp:       (phone) => req('POST', '/settings/test-whatsapp', { phone }),

  // Generic
  get:    (path)        => req('GET',    path),
  post:   (path, data)  => req('POST',   path, data),
  put:    (path, data)  => req('PUT',    path, data),
  delete: (path)        => req('DELETE', path),
};
