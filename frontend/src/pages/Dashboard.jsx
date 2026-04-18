import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';
import { api } from '../api';

function todayISO() { return new Date().toISOString().slice(0, 10); }

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

const STATUS_COLORS = {
  confirmado: 'bg-green-100 text-green-800',
  pendiente:  'bg-yellow-100 text-yellow-800',
  cancelado:  'bg-red-100 text-red-800',
};

export default function Dashboard() {
  const [todayApts, setTodayApts] = useState([]);
  const [weekApts,  setWeekApts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const navigate = useNavigate();
  const today = todayISO();

  useEffect(() => {
    Promise.all([
      api.getAppointments({ date: today }),
      api.getAppointments({ month: today.slice(0, 7) }),
    ]).then(([todayData, monthData]) => {
      setTodayApts(todayData);
      setWeekApts(monthData.filter(a => a.date > today).slice(0, 10));
    }).finally(() => setLoading(false));
  }, [today]);

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
          <div className="divide-y" style={{ borderColor: '#FED7AA' }}>
            {todayApts.map(apt => <AptRow key={apt.id} apt={apt} />)}
          </div>
        )}
      </div>

      {/* Upcoming */}
      {weekApts.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#9A3412' }}>
            <CalendarDays size={18} style={{ color: '#EA580C' }} /> Próximos turnos
          </h2>
          <div className="divide-y" style={{ borderColor: '#FED7AA' }}>
            {weekApts.map(apt => <AptRow key={apt.id} apt={apt} showDate />)}
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

function AptRow({ apt, showDate }) {
  return (
    <div className="py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-16 text-center">
          <span className="text-lg font-bold" style={{ color: '#EA580C' }}>{apt.time}</span>
          {showDate && <p className="text-xs text-stone-400">{apt.date.slice(5).replace('-', '/')}</p>}
        </div>
        <div>
          <p className="font-semibold" style={{ color: '#1C1917' }}>{apt.name}</p>
          <p className="text-sm text-stone-500">{apt.phone}</p>
          {apt.notes && <p className="text-xs text-stone-400 italic">{apt.notes}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {apt.source === 'web' && (
          <span className="badge text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#FED7AA', color: '#9A3412' }}>
            Web
          </span>
        )}
        <span className={`badge ${STATUS_COLORS[apt.status] || 'bg-gray-100 text-gray-700'}`}>
          {apt.status}
        </span>
      </div>
    </div>
  );
}
