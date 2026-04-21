import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Send, ChevronLeft, ChevronRight, Loader2, Mail, Check, X } from 'lucide-react';
import { api } from '../api';

function todayISO() { return new Date().toISOString().slice(0, 10); }

function formatDisplayDate(d) {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
}

const STATUS_CFG = {
  confirmado: { label: 'Confirmado', bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200' },
  pendiente:  { label: 'Pendiente',  bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-200' },
  cancelado:  { label: 'Cancelado',  bg: 'bg-red-100',    text: 'text-red-600',    border: 'border-red-200'   },
};

function StatusBadge({ apt, onChange }) {
  const [busy, setBusy] = useState(false);
  const cfg = STATUS_CFG[apt.status] || STATUS_CFG.pendiente;

  async function change(s) {
    setBusy(true);
    try { await onChange(apt, s); } finally { setBusy(false); }
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
        {cfg.label}
      </span>
      {apt.status === 'pendiente' && (
        <button onClick={() => change('confirmado')} disabled={busy}
          className="text-xs px-2.5 py-0.5 rounded-full bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors flex items-center gap-1 disabled:opacity-50">
          {busy ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} Confirmar
        </button>
      )}
      {apt.status === 'pendiente' && (
        <button onClick={() => change('cancelado')} disabled={busy}
          className="text-xs px-2.5 py-0.5 rounded-full border border-red-300 text-red-500 font-medium hover:bg-red-50 transition-colors flex items-center gap-1 disabled:opacity-50">
          <X size={10} /> Cancelar
        </button>
      )}
      {apt.status === 'confirmado' && (
        <button onClick={() => change('cancelado')} disabled={busy}
          className="text-xs px-2.5 py-0.5 rounded-full border border-gray-200 text-gray-400 font-medium hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50">
          Cancelar
        </button>
      )}
      {apt.status === 'cancelado' && (
        <button onClick={() => change('confirmado')} disabled={busy}
          className="text-xs px-2.5 py-0.5 rounded-full border border-green-200 text-green-600 font-medium hover:bg-green-50 transition-colors flex items-center gap-1 disabled:opacity-50">
          {busy ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} Reactivar
        </button>
      )}
    </div>
  );
}

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editApt, setEditApt]   = useState(null);
  const [toast, setToast]       = useState(null);
  const [staffList, setStaffList]   = useState([]);
  const [services, setServices]     = useState([]);
  const [filterStaff, setFilterStaff]     = useState('');
  const [filterService, setFilterService] = useState('');

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

  useEffect(() => {
    api.getStaff().then(setStaffList).catch(() => {});
    api.get('/services').then(setServices).catch(() => {});
  }, []);

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
    else showToast(
      r.reason === 'email_not_configured' ? 'Email no configurado' :
      r.reason === 'no_email' ? 'Este turno no tiene email' : 'Error al enviar',
      'error'
    );
  }

  const filtered = appointments.filter(a => {
    if (filterStaff   && a.staffId   !== filterStaff)   return false;
    if (filterService && a.serviceName !== filterService) return false;
    return true;
  });

  const uniqueServices = [...new Set(appointments.map(a => a.serviceName).filter(Boolean))];

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

      {/* Filters */}
      {(staffList.length > 0 || uniqueServices.length > 0) && (
        <div className="flex gap-2 flex-wrap">
          {staffList.length > 0 && (
            <select className="input w-auto text-sm" value={filterStaff} onChange={e => setFilterStaff(e.target.value)}>
              <option value="">Todos los profesionales</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          {uniqueServices.length > 0 && (
            <select className="input w-auto text-sm" value={filterService} onChange={e => setFilterService(e.target.value)}>
              <option value="">Todos los servicios</option>
              {uniqueServices.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {(filterStaff || filterService) && (
            <button className="btn-secondary text-sm py-1.5" onClick={() => { setFilterStaff(''); setFilterService(''); }}>
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-blue-600" size={28} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400">
              {appointments.length > 0 ? 'No hay turnos para los filtros seleccionados.' : 'No hay turnos para esta fecha.'}
            </p>
            {appointments.length === 0 && (
              <button className="btn-primary mt-4" onClick={() => { setEditApt(null); setShowModal(true); }}>
                <Plus size={16} /> Agregar turno
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(apt => (
              <div key={apt.id} className={`py-4 ${apt.status === 'cancelado' ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-blue-700 font-bold text-xl w-14 shrink-0 pt-0.5">{apt.time}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-gray-900 text-base leading-snug">{apt.name}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <button title="Reenviar email" className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-orange-600 hover:border-orange-300 transition-colors" onClick={() => handleResend(apt.id)}>
                          <Send size={13} />
                        </button>
                        <button className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-blue-600 hover:border-blue-300 transition-colors" onClick={() => { setEditApt(apt); setShowModal(true); }}>
                          <span className="text-xs font-semibold px-0.5">Editar</span>
                        </button>
                        <button className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-red-500 hover:border-red-300 transition-colors" onClick={() => handleDelete(apt.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {apt.serviceName && <span className="text-sm font-semibold text-orange-600">{apt.serviceName}</span>}
                      {apt.staffName && apt.serviceName && <span className="text-gray-300 text-xs">·</span>}
                      {apt.staffName && <span className="text-sm text-stone-500 font-medium">{apt.staffName}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-400">{apt.phone}</span>
                      {apt.email && <span className="text-xs text-gray-400 truncate max-w-[160px]">{apt.email}</span>}
                    </div>
                    {apt.notes && <p className="text-xs text-gray-400 italic mt-0.5">{apt.notes}</p>}
                    <StatusBadge apt={apt} onChange={handleStatusChange} />
                    {apt.confirmation_sent ? (
                      <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <Mail size={11} /> Email enviado
                      </span>
                    ) : null}
                  </div>
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
    serviceId: initial?.serviceId?.toString() || '',
    staffId:   initial?.staffId?.toString()   || '',
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
