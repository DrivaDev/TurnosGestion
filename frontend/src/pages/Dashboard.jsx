import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';
import { api } from '../api';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

const STATUS_COLORS = {
  confirmado: 'bg-green-100 text-green-800',
  pendiente:  'bg-yellow-100 text-yellow-800',
  cancelado:  'bg-red-100 text-red-800',
};

export default function Dashboard() {
  const [todayApts, setTodayApts]   = useState([]);
  const [weekApts, setWeekApts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const navigate = useNavigate();
  const today = todayISO();

  useEffect(() => {
    Promise.all([
      api.getAppointments({ date: today }),
      api.getAppointments({ month: today.slice(0, 7) }),
    ]).then(([todayData, monthData]) => {
      setTodayApts(todayData);
      // Next 7 days
      const future = monthData.filter(a => a.date >= today && a.date !== today).slice(0, 10);
      setWeekApts(future);
    }).finally(() => setLoading(false));
  }, [today]);

  const confirmed = todayApts.filter(a => a.status !== 'cancelado').length;
  const cancelled = todayApts.filter(a => a.status === 'cancelado').length;

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de control</h1>
          <p className="text-gray-500 text-sm mt-1 capitalize">{formatDate(today)}</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/appointments')}>
          <Plus size={16} /> Nuevo turno
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<CalendarDays className="text-blue-600" />}
          label="Turnos hoy" value={todayApts.length} color="bg-blue-50" />
        <StatCard icon={<CheckCircle className="text-green-600" />}
          label="Confirmados" value={confirmed} color="bg-green-50" />
        <StatCard icon={<XCircle className="text-red-500" />}
          label="Cancelados" value={cancelled} color="bg-red-50" />
      </div>

      {/* Today's appointments */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-blue-600" /> Turnos de hoy
        </h2>
        {todayApts.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No hay turnos para hoy.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {todayApts.map(apt => (
              <AptRow key={apt.id} apt={apt} />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming */}
      {weekApts.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarDays size={18} className="text-blue-600" /> Próximos turnos
          </h2>
          <div className="divide-y divide-gray-100">
            {weekApts.map(apt => (
              <AptRow key={apt.id} apt={apt} showDate />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`card flex items-center gap-4 ${color}`}>
      <div className="p-2 rounded-lg bg-white shadow-sm">{icon}</div>
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function AptRow({ apt, showDate }) {
  return (
    <div className="py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-16 text-center">
          <span className="text-lg font-bold text-blue-600">{apt.time}</span>
          {showDate && (
            <p className="text-xs text-gray-400">{apt.date.slice(5).replace('-', '/')}</p>
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900">{apt.name}</p>
          <p className="text-sm text-gray-500">{apt.phone}</p>
          {apt.notes && <p className="text-xs text-gray-400 italic">{apt.notes}</p>}
        </div>
      </div>
      <span className={`badge ${STATUS_COLORS[apt.status] || 'bg-gray-100 text-gray-700'}`}>
        {apt.status}
      </span>
    </div>
  );
}
