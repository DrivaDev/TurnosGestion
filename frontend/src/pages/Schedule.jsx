import { useEffect, useState } from 'react';
import { Save, Loader2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../api';

const DAYS = [
  { key: 'lunes',     label: 'Lunes' },
  { key: 'martes',    label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves',    label: 'Jueves' },
  { key: 'viernes',   label: 'Viernes' },
  { key: 'sabado',    label: 'Sábado' },
  { key: 'domingo',   label: 'Domingo' },
];

const SLOT_OPTS = [15, 20, 30, 45, 60];

function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay + 6) % 7; // Monday first
  return { offset, daysInMonth };
}

export default function Schedule() {
  const [schedule, setSchedule]       = useState({});
  const [blockedDays, setBlockedDays] = useState([]);
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState(null);
  const [calMonth, setCalMonth]       = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    Promise.all([api.getSchedule(), api.getBlockedDays()]).then(([sched, bd]) => {
      setSchedule(sched);
      setBlockedDays(bd);
    });
  }, []);

  function updateDay(key, field, value) {
    setSchedule(s => ({ ...s, [key]: { ...s[key], [field]: value } }));
  }

  async function saveSchedule() {
    setSaving(true);
    try {
      await api.updateSchedule(schedule);
      showToast('Horarios guardados');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  function isoDate(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  async function toggleBlockedDay(dateStr) {
    if (blockedDays.includes(dateStr)) {
      await api.removeBlockedDay(dateStr);
      setBlockedDays(bd => bd.filter(d => d !== dateStr));
    } else {
      await api.addBlockedDay(dateStr);
      setBlockedDays(bd => [...bd, dateStr].sort());
    }
  }

  const { offset, daysInMonth } = buildCalendar(calMonth.year, calMonth.month);
  const calLabel = new Date(calMonth.year, calMonth.month).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  function shiftMonth(d) {
    setCalMonth(c => {
      let m = c.month + d;
      let y = c.year;
      if (m < 0)  { m = 11; y--; }
      if (m > 11) { m = 0;  y++; }
      return { year: y, month: m };
    });
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Horarios y disponibilidad</h1>
        <button className="btn-primary" onClick={saveSchedule} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Guardar horarios
        </button>
      </div>

      {/* Weekly schedule */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Horario semanal</h2>
        <div className="space-y-3">
          {DAYS.map(({ key, label }) => {
            const d = schedule[key] || { enabled: false, start: '09:00', end: '18:00', slotDuration: 30 };
            return (
              <div key={key} className={`flex flex-wrap items-center gap-4 p-4 rounded-xl border transition-colors ${
                d.enabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
              }`}>
                <label className="flex items-center gap-2 w-32 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={d.enabled || false}
                    onChange={e => updateDay(key, 'enabled', e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="font-medium text-sm">{label}</span>
                </label>

                {d.enabled && (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <label className="text-gray-500">Desde</label>
                      <input type="time" className="input w-28"
                        value={d.start || '09:00'}
                        onChange={e => updateDay(key, 'start', e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <label className="text-gray-500">Hasta</label>
                      <input type="time" className="input w-28"
                        value={d.end || '18:00'}
                        onChange={e => updateDay(key, 'end', e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <label className="text-gray-500">Turno c/</label>
                      <select className="input w-24"
                        value={d.slotDuration || 30}
                        onChange={e => updateDay(key, 'slotDuration', Number(e.target.value))}>
                        {SLOT_OPTS.map(m => <option key={m} value={m}>{m} min</option>)}
                      </select>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar - blocked days */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-blue-600" /> Días sin atención
        </h2>
        <p className="text-sm text-gray-500 mb-4">Hacé clic en un día para marcarlo como no disponible (feriados, vacaciones, etc.)</p>

        <div className="flex items-center justify-between mb-4">
          <button className="btn-secondary py-1 px-3" onClick={() => shiftMonth(-1)}>
            <ChevronLeft size={16} />
          </button>
          <span className="font-semibold capitalize">{calLabel}</span>
          <button className="btn-secondary py-1 px-3" onClick={() => shiftMonth(1)}>
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => (
            <div key={d} className="text-xs font-medium text-gray-500 py-1">{d}</div>
          ))}
          {Array.from({ length: offset }).map((_, i) => <div key={`o${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const dateStr = isoDate(calMonth.year, calMonth.month, day);
            const blocked = blockedDays.includes(dateStr);
            const isToday = dateStr === todayStr;
            return (
              <button
                key={day}
                onClick={() => toggleBlockedDay(dateStr)}
                className={`py-2 text-sm rounded-lg transition-colors font-medium ${
                  blocked
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : isToday
                    ? 'bg-blue-100 text-blue-700 hover:bg-red-100'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {blockedDays.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-gray-700 mb-2">Días bloqueados:</p>
            <div className="flex flex-wrap gap-2">
              {blockedDays.map(d => (
                <span key={d} className="flex items-center gap-1 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  {d}
                  <button onClick={() => toggleBlockedDay(d)} className="hover:text-red-900">&times;</button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
