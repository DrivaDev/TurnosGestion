import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Send, ChevronLeft, ChevronRight, Loader2, Mail } from 'lucide-react';
import { api } from '../api';

function todayISO() { return new Date().toISOString().slice(0, 10); }

function formatDisplayDate(d) {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
}

const STATUS_OPTS = ['confirmado', 'pendiente', 'cancelado'];

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editApt, setEditApt] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(() => {
    setLoading(true);
    api.getAppointments({ date: selectedDate })
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, [selectedDate]);

  useEffect(() => { load(); }, [load]);

  function shiftDate(days) {
    const d = new Date(`${selectedDate}T12:00:00`);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este turno?')) return;
    await api.deleteAppointment(id);
    showToast('Turno eliminado');
    load();
  }

  async function handleStatusChange(apt, status) {
    await api.updateAppointment(apt.id, { status });
    load();
  }

  async function handleResend(id) {
    const r = await api.resendConfirmation(id);
    if (r.ok) showToast('Confirmación enviada por email ✅');
    else showToast(r.reason === 'email_not_configured' ? 'Email no configurado' : r.reason === 'no_email' ? 'Este turno no tiene email asociado' : 'Error al enviar', 'error');
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Turnos</h1>
        <button className="btn-primary" onClick={() => { setEditApt(null); setShowModal(true); }}>
          <Plus size={16} /> Nuevo turno
        </button>
      </div>

      <div className="card flex items-center justify-between py-3">
        <button className="btn-secondary py-1.5 px-3" onClick={() => shiftDate(-1)}>
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <input
            type="date"
            className="input w-auto text-center font-semibold"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-0.5 capitalize">{formatDisplayDate(selectedDate)}</p>
        </div>
        <button className="btn-secondary py-1.5 px-3" onClick={() => shiftDate(1)}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-blue-600" size={28} />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400">No hay turnos para esta fecha.</p>
            <button className="btn-primary mt-4" onClick={() => { setEditApt(null); setShowModal(true); }}>
              <Plus size={16} /> Agregar turno
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {appointments.map(apt => (
              <div key={apt.id} className="py-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-blue-700 font-bold text-lg w-14 shrink-0">{apt.time}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{apt.name}</p>
                    {apt.serviceName && <p className="text-xs font-medium text-orange-600">{apt.serviceName}</p>}
                    {apt.staffName && <p className="text-xs text-stone-500">con {apt.staffName}</p>}
                    <p className="text-sm text-gray-500">{apt.phone}</p>
                    {apt.email && <p className="text-xs text-gray-400">{apt.email}</p>}
                    {apt.notes && <p className="text-xs text-gray-400 italic mt-0.5">{apt.notes}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <select
                        value={apt.status}
                        className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
                        onChange={e => handleStatusChange(apt, e.target.value)}
                      >
                        {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {apt.confirmation_sent ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <Mail size={12} /> Email enviado
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className="btn-secondary py-1 px-2 text-xs"
                    title="Reenviar confirmación por email"
                    onClick={() => handleResend(apt.id)}
                  >
                    <Send size={13} />
                  </button>
                  <button
                    className="btn-secondary py-1 px-2 text-xs"
                    onClick={() => { setEditApt(apt); setShowModal(true); }}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-danger py-1 px-2 text-xs"
                    onClick={() => handleDelete(apt.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AppointmentModal
          initial={editApt}
          defaultDate={selectedDate}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); showToast(editApt ? 'Turno actualizado' : 'Turno creado'); }}
          onError={msg => showToast(msg, 'error')}
        />
      )}
    </div>
  );
}

function AppointmentModal({ initial, defaultDate, onClose, onSaved, onError }) {
  const [form, setForm] = useState({
    name:      initial?.name      || '',
    phone:     initial?.phone     || '',
    email:     initial?.email     || '',
    date:      initial?.date      || defaultDate,
    time:      initial?.time      || '',
    notes:     initial?.notes     || '',
    serviceId: initial?.serviceId || '',
    staffId:   initial?.staffId   || '',
    sendEmail: true,
  });
  const [services, setServices]   = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [slots, setSlots]         = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    api.get('/services').then(s => setServices(s)).catch(() => {});
    api.getStaff().then(s => setStaffList(s)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.date) return;
    setLoadingSlots(true);
    const serviceParam = form.serviceId ? `&serviceId=${form.serviceId}` : '';
    const staffParam   = form.staffId   ? `&staffId=${form.staffId}`     : '';
    api.getAvailableSlots(form.date, initial?.id, serviceParam + staffParam)
      .then(({ slots }) => {
        setSlots(slots || []);
        if (slots && !slots.includes(form.time)) setForm(f => ({ ...f, time: slots[0] || '' }));
      })
      .finally(() => setLoadingSlots(false));
  }, [form.date, form.serviceId, form.staffId]);

  // Filter staff by selected service
  const filteredStaff = form.serviceId
    ? staffList.filter(s => s.serviceIds?.includes(form.serviceId))
    : staffList;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.phone || !form.date || !form.time) {
      onError('Completá todos los campos requeridos');
      return;
    }
    setSaving(true);
    try {
      if (initial) {
        await api.updateAppointment(initial.id, form);
      } else {
        await api.createAppointment(form);
      }
      onSaved();
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b shrink-0">
          <h2 className="font-semibold text-lg">{initial ? 'Editar turno' : 'Nuevo turno'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <label className="label">Nombre del cliente *</label>
            <input className="input" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Juan Pérez" required />
          </div>
          <div>
            <label className="label">Teléfono *</label>
            <input className="input" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+5491122334455" required />
          </div>
          <div>
            <label className="label">Email (para confirmación)</label>
            <input type="email" className="input" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="cliente@email.com" />
          </div>
          <div>
            <label className="label">Fecha *</label>
            <input type="date" className="input" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
          </div>
          {services.length > 0 && (
            <div>
              <label className="label">Servicio</label>
              <select className="input" value={form.serviceId}
                onChange={e => setForm(f => ({ ...f, serviceId: e.target.value, staffId: '', time: '' }))}>
                <option value="">Sin especificar</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.durationMin < 60 ? `${s.durationMin}min` : `${s.durationMin/60}h`})
                  </option>
                ))}
              </select>
            </div>
          )}
          {filteredStaff.length > 0 && (
            <div>
              <label className="label">Profesional</label>
              <select className="input" value={form.staffId}
                onChange={e => setForm(f => ({ ...f, staffId: e.target.value, time: '' }))}>
                <option value="">Sin especificar</option>
                {filteredStaff.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Horario *</label>
            {loadingSlots ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={14} className="animate-spin" /> Cargando horarios...
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-red-500">No hay horarios disponibles para esta fecha.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                {slots.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`text-sm py-1.5 rounded-lg border transition-colors ${
                      form.time === s
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                    onClick={() => setForm(f => ({ ...f, time: s }))}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="label">Notas (opcional)</label>
            <textarea className="input" rows={2} value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Observaciones..." />
          </div>
          {form.email && (
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.sendEmail}
                onChange={e => setForm(f => ({ ...f, sendEmail: e.target.checked }))}
                className="rounded" />
              Enviar confirmación por email
            </label>
          )}
        </form>
        <div className="flex gap-3 p-6 pt-0 border-t shrink-0">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancelar</button>
          <button type="submit" form="" className="btn-primary flex-1" disabled={saving || !form.time}
            onClick={handleSubmit}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {initial ? 'Guardar cambios' : 'Crear turno'}
          </button>
        </div>
      </div>
    </div>
  );
}
