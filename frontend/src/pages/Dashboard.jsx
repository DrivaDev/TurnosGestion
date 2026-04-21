import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, CheckCircle, XCircle, Plus, Loader2, Mail, Check, X } from 'lucide-react';
import { api } from '../api';

function todayISO() { return new Date().toISOString().slice(0, 10); }

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
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

function AptRow({ apt, showDate, onChange }) {
  return (
    <div className={`py-4 flex items-start gap-3 ${apt.status === 'cancelado' ? 'opacity-60' : ''}`}>
      <div className="shrink-0 text-center w-14">
        <span className="text-xl font-bold text-blue-700">{apt.time}</span>
        {showDate && <p className="text-xs text-stone-400 mt-0.5">{apt.date.slice(5).replace('-', '/')}</p>}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-gray-900 text-base">{apt.name}</p>
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          {apt.serviceName && <span className="text-sm font-semibold text-orange-600">{apt.serviceName}</span>}
          {apt.staffName && apt.serviceName && <span className="text-gray-300 text-xs">·</span>}
          {apt.staffName && <span className="text-sm text-stone-500 font-medium">{apt.staffName}</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-400">{apt.phone}</span>
          {apt.email && <span className="text-xs text-gray-400">{apt.email}</span>}
        </div>
        {apt.notes && <p className="text-xs text-gray-400 italic mt-0.5">{apt.notes}</p>}
        <StatusBadge apt={apt} onChange={onChange} />
        {apt.confirmation_sent ? (
          <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
            <Mail size={11} /> Email enviado
          </span>
        ) : null}
      </div>
      {apt.source === 'web' && (
        <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{ background: '#FED7AA', color: '#9A3412' }}>
          Web
        </span>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [todayApts, setTodayApts] = useState([]);
  const [weekApts,  setWeekApts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const navigate = useNavigate();
  const today = todayISO();

  const load = useCallback(() => {
    return Promise.all([
      api.getAppointments({ date: today }),
      api.getAppointments({ month: today.slice(0, 7) }),
    ]).then(([todayData, monthData]) => {
      setTodayApts(todayData);
      setWeekApts(monthData.filter(a => a.date > today).slice(0, 10));
    });
  }, [today]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleStatusChange(apt, status) {
    await api.updateAppointment(apt.id, { status });
    await load();
  }

  const confirmed = todayApts.filter(a => a.status !== 'cancelado').length;
  const cancelled = todayApts.filter(a => a.status === 'cancelado').length;

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#EA580C' }} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#9A3412' }}>Panel de control</h1>
          <p className="text-stone-500 text-sm mt-1 capitalize">{formatDate(today)}</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/appointments')}>
          <Plus size={16} /> Nuevo turno
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard Icon={CalendarDays} label="Turnos hoy"  value={todayApts.length} bg="#FFF7ED" iconColor="#EA580C" />
        <StatCard Icon={CheckCircle}  label="Confirmados" value={confirmed}         bg="#f0fdf4" iconColor="#16a34a" />
        <StatCard Icon={XCircle}      label="Cancelados"  value={cancelled}         bg="#fef2f2" iconColor="#dc2626" />
      </div>

      {/* Today */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#9A3412' }}>
          <Clock size={18} style={{ color: '#EA580C' }} /> Turnos de hoy
        </h2>
        {todayApts.length === 0 ? (
          <p className="text-stone-400 text-sm text-center py-6">No hay turnos para hoy.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {todayApts.map(apt => (
              <AptRow key={apt.id} apt={apt} onChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming */}
      {weekApts.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#9A3412' }}>
            <CalendarDays size={18} style={{ color: '#EA580C' }} /> Próximos turnos
          </h2>
          <div className="divide-y divide-gray-100">
            {weekApts.map(apt => (
              <AptRow key={apt.id} apt={apt} showDate onChange={handleStatusChange} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ Icon, label, value, bg, iconColor }) {
  return (
    <div className="card flex items-center gap-4" style={{ background: bg }}>
      <div className="p-2 rounded-xl bg-white shadow-sm">
        <Icon size={22} style={{ color: iconColor }} />
      </div>
      <div>
        <p className="text-sm text-stone-500">{label}</p>
        <p className="text-3xl font-bold" style={{ color: '#1C1917' }}>{value}</p>
      </div>
    </div>
  );
}
