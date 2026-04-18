import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { tenantConfigs } from '../tenantConfigs';
import { CalendarDays, Clock, User, Phone, CheckCircle, ChevronLeft, ChevronRight, Loader2, MessageSquare } from 'lucide-react';

const BASE = '/api/public';

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_ES   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const DAY_KEYS  = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];

function toISO(y, m, d) {
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function todayISO() { return new Date().toISOString().slice(0, 10); }

function formatDateLong(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const days = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  return `${days[date.getDay()]} ${d} de ${MONTHS_ES[m - 1].toLowerCase()}`;
}

function DrivaBadge() {
  return (
    <div className="text-center py-6 mt-4">
      <p className="text-xs text-stone-400">
        Desarrollado por{' '}
        <a
          href="https://drivadev.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold transition-colors"
          style={{ color: '#EA580C' }}
        >
          Driva Dev
        </a>
        {' '}· Soluciones digitales a medida
      </p>
    </div>
  );
}

export default function BookingPage() {
  const { slug } = useParams();
  const [business, setBusiness] = useState(null);
  const [notFound, setNotFound] = useState(false);

  // Step: 'date' | 'time' | 'form' | 'success'
  const [step, setStep]           = useState('date');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [slots, setSlots]         = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm]           = useState({ name: '', phone: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [bookedApt, setBookedApt] = useState(null);

  const [calDate, setCalDate] = useState(() => {
    const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() };
  });

  useEffect(() => {
    fetch(`${BASE}/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setBusiness(d); else setNotFound(true); })
      .catch(() => setNotFound(true));
  }, [slug]);

  async function handleDateSelect(dateStr) {
    setSelectedDate(dateStr);
    setSelectedTime('');
    setLoadingSlots(true);
    setStep('time');
    try {
      const res = await fetch(`${BASE}/${slug}/slots?date=${dateStr}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch { setSlots([]); }
    finally { setLoadingSlots(false); }
  }

  function handleTimeSelect(t) {
    setSelectedTime(t);
    setStep('form');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Completá tu nombre y teléfono');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/${slug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, date: selectedDate, time: selectedTime }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al reservar'); return; }
      setBookedApt(data.appointment);
      setStep('success');
    } catch { setError('Error de conexión. Intentá de nuevo.'); }
    finally { setSubmitting(false); }
  }

  function shiftMonth(d) {
    setCalDate(c => {
      let m = c.month + d, y = c.year;
      if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
      return { year: y, month: m };
    });
  }

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#FFF7ED' }}>
      <CalendarDays size={48} style={{ color: '#EA580C' }} className="mb-4 opacity-50" />
      <h1 className="text-2xl font-bold mb-2" style={{ color: '#9A3412' }}>Página no encontrada</h1>
      <p className="text-stone-500">El enlace de reservas no es válido.</p>
      <DrivaBadge />
    </div>
  );

  if (!business) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFF7ED' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: '#EA580C' }} />
    </div>
  );

  // Code config (tenantConfigs.js) takes priority over DB values
  const codeConfig = tenantConfigs[slug]?.theme || {};
  const theme = {
    primary:   codeConfig.primary   || business.theme?.primary   || '#EA580C',
    secondary: codeConfig.secondary || business.theme?.secondary || '#9A3412',
    accent:    codeConfig.accent    || business.theme?.accent    || '#FED7AA',
    bg:        codeConfig.bg        || business.theme?.bg        || '#FFF7ED',
    logo:      codeConfig.logo      || business.theme?.logo      || '',
  };

  const today = todayISO();
  const firstDay = new Date(calDate.year, calDate.month, 1).getDay();
  const daysInMonth = new Date(calDate.year, calDate.month + 1, 0).getDate();
  const offset = (firstDay + 6) % 7;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: theme.bg }}>
      {/* Header */}
      <header className="py-8 px-4 text-center" style={{ background: theme.secondary }}>
        <div className="max-w-lg mx-auto">
          {theme.logo && (
            <img src={theme.logo} alt="logo" className="w-16 h-16 rounded-full object-cover mx-auto mb-4 border-2 border-white/30" />
          )}
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-4">
            <CalendarDays size={14} className="text-white/80" />
            <span className="text-white/80 text-xs font-medium tracking-wide uppercase">Reservas online</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{business.businessName}</h1>
          {business.businessDescription && (
            <p className="text-white/70 text-sm max-w-sm mx-auto">{business.businessDescription}</p>
          )}
        </div>
      </header>

      {/* Progress bar */}
      {step !== 'success' && (
        <div className="sticky top-0 z-10 border-b" style={{ background: '#fff', borderColor: theme.accent }}>
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            {[
              { id: 'date', label: 'Fecha',   Icon: CalendarDays },
              { id: 'time', label: 'Horario', Icon: Clock },
              { id: 'form', label: 'Datos',   Icon: User },
            ].map(({ id, label, Icon }, i, arr) => {
              const steps = ['date','time','form'];
              const idx   = steps.indexOf(step);
              const myIdx = steps.indexOf(id);
              const done  = myIdx < idx;
              const active = myIdx === idx;
              return (
                <div key={id} className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      done ? 'text-white' : active ? 'text-white' : 'text-stone-400 bg-stone-100'
                    }`} style={done || active ? { background: theme.primary } : {}}>
                      {done ? '✓' : <Icon size={13} />}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${active ? 'text-stone-800' : done ? 'text-stone-500' : 'text-stone-400'}`}>
                      {label}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="flex-1 h-px mx-1" style={{ background: myIdx < idx ? theme.primary : theme.accent }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">

        {/* ── Step 1: Date ── */}
        {step === 'date' && (
          <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: theme.accent }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: theme.secondary }}>¿Qué día te queda bien?</h2>

            <div className="flex items-center justify-between mb-4">
              <button onClick={() => shiftMonth(-1)} className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
                <ChevronLeft size={18} style={{ color: theme.secondary }} />
              </button>
              <span className="font-semibold text-stone-800">
                {MONTHS_ES[calDate.month]} {calDate.year}
              </span>
              <button onClick={() => shiftMonth(1)} className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
                <ChevronRight size={18} style={{ color: theme.secondary }} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {DAYS_ES.map(d => (
                <div key={d} className="text-xs font-medium text-stone-400 py-1">{d}</div>
              ))}
              {Array.from({ length: offset }).map((_, i) => <div key={`o${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dateStr  = toISO(calDate.year, calDate.month, day);
                const isPast   = dateStr < today;
                const isToday  = dateStr === today;
                const isSelected = dateStr === selectedDate;
                return (
                  <button
                    key={day}
                    disabled={isPast}
                    onClick={() => handleDateSelect(dateStr)}
                    className={`py-2.5 text-sm rounded-xl transition-all font-medium ${
                      isPast ? 'text-stone-300 cursor-not-allowed' :
                      isSelected ? 'text-white font-bold' :
                      isToday ? 'ring-2 font-bold' :
                      'hover:text-white'
                    }`}
                    style={
                      isSelected ? { background: theme.primary } :
                      isToday ? { color: theme.primary } :
                      {}
                    }
                    onMouseEnter={e => { if (!isPast && !isSelected) e.currentTarget.style.background = theme.accent; }}
                    onMouseLeave={e => { if (!isPast && !isSelected) e.currentTarget.style.background = ''; }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 2: Time ── */}
        {step === 'time' && (
          <div className="space-y-4">
            <button onClick={() => setStep('date')} className="flex items-center gap-1 text-sm font-medium hover:underline" style={{ color: theme.primary }}>
              <ChevronLeft size={16} /> Cambiar fecha
            </button>
            <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: theme.accent }}>
              <h2 className="text-lg font-bold mb-1" style={{ color: theme.secondary }}>Elegí tu horario</h2>
              <p className="text-stone-500 text-sm mb-4 capitalize">{formatDateLong(selectedDate)}</p>

              {loadingSlots ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={24} className="animate-spin" style={{ color: theme.primary }} />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8">
                  <Clock size={36} className="mx-auto mb-3 opacity-30" style={{ color: theme.secondary }} />
                  <p className="text-stone-500 font-medium">No hay horarios disponibles para este día.</p>
                  <button onClick={() => setStep('date')} className="mt-4 text-sm font-semibold underline" style={{ color: theme.primary }}>
                    Elegir otro día
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map(t => (
                    <button
                      key={t}
                      onClick={() => handleTimeSelect(t)}
                      className={`brand-slot ${selectedTime === t ? 'selected' : ''}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: Form ── */}
        {step === 'form' && (
          <div className="space-y-4">
            <button onClick={() => setStep('time')} className="flex items-center gap-1 text-sm font-medium hover:underline" style={{ color: theme.primary }}>
              <ChevronLeft size={16} /> Cambiar horario
            </button>

            {/* Summary */}
            <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: theme.accent }}>
              <CalendarDays size={20} style={{ color: theme.secondary }} />
              <div>
                <p className="font-bold text-sm capitalize" style={{ color: theme.secondary }}>{formatDateLong(selectedDate)}</p>
                <p className="text-xs text-stone-600">a las <strong>{selectedTime}</strong></p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: theme.accent }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: theme.secondary }}>Tus datos</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1C1917' }}>
                    <User size={14} className="inline mr-1" /> Nombre completo *
                  </label>
                  <input
                    className="brand-input"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1C1917' }}>
                    <Phone size={14} className="inline mr-1" /> WhatsApp *
                  </label>
                  <input
                    className="brand-input"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+5491122334455"
                    required
                  />
                  <p className="text-xs text-stone-400 mt-1">Con código de país. Ej: +5491122334455</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1C1917' }}>
                    <MessageSquare size={14} className="inline mr-1" /> Notas (opcional)
                  </label>
                  <textarea
                    className="brand-input"
                    rows={2}
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Alguna indicación especial..."
                  />
                </div>
                <button type="submit" className="brand-btn w-full py-4 text-base mt-2" disabled={submitting}>
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  Confirmar turno
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── Success ── */}
        {step === 'success' && bookedApt && (
          <div className="flex flex-col items-center text-center py-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: theme.accent }}>
              <CheckCircle size={40} style={{ color: theme.primary }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: theme.secondary }}>¡Turno confirmado!</h2>
            <p className="text-stone-500 mb-6">Te enviamos la confirmación por WhatsApp.</p>

            <div className="w-full rounded-2xl p-5 text-left space-y-3 mb-6" style={{ background: theme.accent }}>
              <div className="flex items-center gap-3">
                <User size={18} style={{ color: theme.secondary }} />
                <div>
                  <p className="text-xs text-stone-500">Nombre</p>
                  <p className="font-semibold" style={{ color: '#1C1917' }}>{bookedApt.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays size={18} style={{ color: theme.secondary }} />
                <div>
                  <p className="text-xs text-stone-500">Fecha</p>
                  <p className="font-semibold capitalize" style={{ color: '#1C1917' }}>{formatDateLong(bookedApt.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={18} style={{ color: theme.secondary }} />
                <div>
                  <p className="text-xs text-stone-500">Hora</p>
                  <p className="font-semibold" style={{ color: '#1C1917' }}>{bookedApt.time}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => { setStep('date'); setSelectedDate(''); setSelectedTime(''); setForm({ name: '', phone: '', notes: '' }); }}
              className="brand-btn px-8"
            >
              Reservar otro turno
            </button>
          </div>
        )}
      </main>

      <DrivaBadge />
    </div>
  );
}
