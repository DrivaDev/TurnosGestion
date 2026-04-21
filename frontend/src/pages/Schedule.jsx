import { useEffect, useState } from 'react';
import { Save, Loader2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../api';

function TimeInput({ value, onChange }) {
  return (
    <input
      type="time"
      value={value || '09:00'}
      onChange={e => onChange(e.target.value)}
      className="border border-stone-200 rounded-lg px-2 py-1.5 text-sm font-medium bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
    />
  );
}

const DAYS = [
  { key: 'lunes',     label: 'Lunes' },
  { key: 'martes',    label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves',    label: 'Jueves' },
  { key: 'viernes',   label: 'Viernes' },
  { key: 'sabado',    label: 'Sábado' },
  { key: 'domingo',   label: 'Domingo' },
];


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

  const DEFAULT_DAY = (enabled) => ({ enabled, start: '09:00', end: enabled ? '18:00' : '13:00' });

  useEffect(() => {
    Promise.all([api.getSchedule(), api.getBlockedDays()]).then(([sched, bd]) => {
      const defaults = {
        lunes: DEFAULT_DAY(true), martes: DEFAULT_DAY(true), miercoles: DEFAULT_DAY(true),
        jueves: DEFAULT_DAY(true), viernes: DEFAULT_DAY(true),
        sabado: DEFAULT_DAY(false), domingo: DEFAULT_DAY(false),
      };
      setSchedule({ ...defaults, ...sched });
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
            const d = schedule[key] || { enabled: false, start: '09:00', end: '18:00' };
            return (
              <div key={key} className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors"
                style={d.enabled ? { borderColor: '#FED7AA', background: '#FFF7ED' } : { borderColor: '#e7e5e4', background: '#f5f5f4' }}>
                <button type="button" onClick={() => updateDay(key, 'enabled', !d.enabled)}
                  className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${d.enabled ? 'bg-orange-500' : 'bg-stone-300'}`}>
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${d.enabled ? 'left-5' : 'left-1'}`} />
                </button>
                <span className={`text-sm font-semibold w-24 shrink-0 ${d.enabled ? 'text-stone-800' : 'text-stone-400'}`}>{label}</span>
                {d.enabled ? (
                  <div className="flex items-center gap-2 ml-auto flex-wrap">
                    <TimeInput value={d.start || '09:00'} onChange={v => updateDay(key, 'start', v)} />
                    <span className="text-xs text-stone-400">–</span>
                    <TimeInput value={d.end || '18:00'} onChange={v => updateDay(key, 'end', v)} />
                  </div>
                ) : (
                  <span className="text-xs text-stone-400 ml-auto">No disponible</span>
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
