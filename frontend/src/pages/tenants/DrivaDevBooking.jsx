import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CalendarDays, Clock, User, Phone, CheckCircle,
  ChevronLeft, ChevronRight, Loader2, MessageSquare,
  Zap, Shield, Headphones, ArrowRight, Sparkles,
} from 'lucide-react';

const BASE = '/api/public';
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_ES   = ['L','M','M','J','V','S','D'];

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

// ── Shared styles ────────────────────────────────────────────────────────────
const glass = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.10)',
  backdropFilter: 'blur(20px)',
};
const glassHover = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(234,88,12,0.40)',
};

// ── Steps indicator ──────────────────────────────────────────────────────────
function StepBar({ step }) {
  const steps = [
    { id: 'date', label: 'Fecha' },
    { id: 'time', label: 'Horario' },
    { id: 'form', label: 'Datos' },
  ];
  const idx = steps.findIndex(s => s.id === step);
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => {
        const done   = i < idx;
        const active = i === idx;
        return (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                style={
                  done   ? { background: 'linear-gradient(135deg,#EA580C,#F97316)', color: '#fff' } :
                  active ? { background: 'linear-gradient(135deg,#EA580C,#F97316)', color: '#fff', boxShadow: '0 0 20px rgba(234,88,12,0.5)' } :
                           { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }
                }
              >
                {done ? '✓' : i + 1}
              </div>
              <span className="text-xs font-medium" style={{ color: active ? '#F97316' : done ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-16 h-px mx-2 mb-4 transition-all duration-500"
                style={{ background: i < idx ? 'linear-gradient(90deg,#EA580C,#F97316)' : 'rgba(255,255,255,0.1)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function DrivaDevBooking() {
  const { slug } = useParams();
  const [business, setBusiness]     = useState(null);
  const [notFound, setNotFound]     = useState(false);
  const [step, setStep]             = useState('date');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [slots, setSlots]           = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm]             = useState({ name: '', phone: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [bookedApt, setBookedApt]   = useState(null);
  const [calDate, setCalDate]       = useState(() => {
    const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() };
  });
  const [hoveredDay, setHoveredDay] = useState(null);

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

  function handleTimeSelect(t) { setSelectedTime(t); setStep('form'); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.phone.trim()) { setError('Completá tu nombre y teléfono'); return; }
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#0A0A0A' }}>
      <div className="text-6xl mb-4">404</div>
      <p className="text-white/40">Página no encontrada</p>
    </div>
  );

  if (!business) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#EA580C,#F97316)' }}>
          <Zap size={24} className="text-white" />
        </div>
        <Loader2 size={20} className="animate-spin" style={{ color: '#EA580C' }} />
      </div>
    </div>
  );

  const today = todayISO();
  const firstDayOfMonth = new Date(calDate.year, calDate.month, 1).getDay();
  const daysInMonth = new Date(calDate.year, calDate.month + 1, 0).getDate();
  const offset = (firstDayOfMonth + 6) % 7;

  return (
    <div className="min-h-screen font-sans" style={{ background: '#0A0A0A' }}>

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute" style={{
          top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: '800px', height: '600px',
          background: 'radial-gradient(ellipse, rgba(234,88,12,0.12) 0%, transparent 70%)',
        }} />
        <div className="absolute" style={{
          bottom: '10%', right: '-10%',
          width: '400px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(234,88,12,0.06) 0%, transparent 70%)',
        }} />
        {/* Grid overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* ── Header ── */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#EA580C,#F97316)' }}>
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">Driva Dev</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: 'rgba(234,88,12,0.15)', color: '#F97316', border: '1px solid rgba(234,88,12,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block mr-1" />
          Agenda disponible
        </div>
      </header>

      {/* ── Hero ── */}
      {step === 'date' && (
        <section className="relative z-10 max-w-5xl mx-auto px-6 pt-8 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6" style={{ background: 'rgba(234,88,12,0.12)', color: '#F97316', border: '1px solid rgba(234,88,12,0.2)' }}>
            <Sparkles size={12} />
            Soluciones digitales a medida
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            Reservá tu{' '}
            <span style={{ background: 'linear-gradient(135deg,#EA580C,#F97316,#FDBA74)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              consultoría
            </span>
            <br />con Driva Dev
          </h1>
          <p className="text-white/50 text-lg max-w-md mx-auto mb-10">
            Contanos tu proyecto. En 30 minutos te decimos cómo lo hacemos realidad.
          </p>

          {/* Value props */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mb-12">
            {[
              { icon: Zap,       title: 'Rápido',     desc: 'Primera respuesta en menos de 24hs' },
              { icon: Shield,    title: 'Garantizado', desc: 'Resultados o seguimos trabajando' },
              { icon: Headphones,title: 'Soporte',     desc: 'Acompañamiento post-entrega incluido' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl p-4 text-left" style={glass}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(234,88,12,0.15)' }}>
                  <Icon size={16} style={{ color: '#F97316' }} />
                </div>
                <p className="font-semibold text-white text-sm mb-0.5">{title}</p>
                <p className="text-xs text-white/40">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Booking card ── */}
      <main className="relative z-10 max-w-lg mx-auto px-4 pb-16">

        {/* Step bar (only during booking flow) */}
        {step !== 'success' && <StepBar step={step} />}

        {/* ── STEP 1: Date ── */}
        {step === 'date' && (
          <div className="rounded-3xl p-6 shadow-2xl" style={{ ...glass, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => shiftMonth(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all" style={glass}
                onMouseEnter={e => Object.assign(e.currentTarget.style, glassHover)}
                onMouseLeave={e => Object.assign(e.currentTarget.style, glass)}
              >
                <ChevronLeft size={16} className="text-white" />
              </button>
              <span className="font-bold text-white">
                {MONTHS_ES[calDate.month]} {calDate.year}
              </span>
              <button onClick={() => shiftMonth(1)} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all" style={glass}
                onMouseEnter={e => Object.assign(e.currentTarget.style, glassHover)}
                onMouseLeave={e => Object.assign(e.currentTarget.style, glass)}
              >
                <ChevronRight size={16} className="text-white" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {DAYS_ES.map((d, i) => (
                <div key={i} className="text-xs font-semibold py-2" style={{ color: 'rgba(255,255,255,0.25)' }}>{d}</div>
              ))}
              {Array.from({ length: offset }).map((_, i) => <div key={`o${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dateStr   = toISO(calDate.year, calDate.month, day);
                const isPast    = dateStr < today;
                const isToday   = dateStr === today;
                const isSelected = dateStr === selectedDate;
                const isHovered  = dateStr === hoveredDay;
                return (
                  <button
                    key={day}
                    disabled={isPast}
                    onClick={() => handleDateSelect(dateStr)}
                    onMouseEnter={() => !isPast && setHoveredDay(dateStr)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                    style={
                      isSelected ? { background: 'linear-gradient(135deg,#EA580C,#F97316)', color: '#fff', boxShadow: '0 4px 15px rgba(234,88,12,0.4)' } :
                      isHovered && !isPast ? { background: 'rgba(234,88,12,0.2)', color: '#F97316' } :
                      isToday ? { color: '#F97316', border: '1px solid rgba(234,88,12,0.4)' } :
                      isPast ? { color: 'rgba(255,255,255,0.12)', cursor: 'not-allowed' } :
                      { color: 'rgba(255,255,255,0.7)' }
                    }
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <CalendarDays size={13} />
              Seleccioná el día que más te convenga
            </div>
          </div>
        )}

        {/* ── STEP 2: Time ── */}
        {step === 'time' && (
          <div className="space-y-4">
            <button onClick={() => setStep('date')} className="flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: '#F97316' }}>
              <ChevronLeft size={16} /> Cambiar fecha
            </button>

            <div className="rounded-3xl p-6 shadow-2xl" style={{ ...glass, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
              <div className="mb-5">
                <h2 className="font-bold text-white text-lg">Elegí tu horario</h2>
                <p className="text-sm capitalize mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{formatDateLong(selectedDate)}</p>
              </div>

              {loadingSlots ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 size={24} className="animate-spin" style={{ color: '#F97316' }} />
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Verificando disponibilidad...</p>
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <Clock size={24} style={{ color: 'rgba(255,255,255,0.2)' }} />
                  </div>
                  <p className="text-white/50 font-medium mb-1">Sin horarios disponibles</p>
                  <p className="text-xs text-white/30 mb-4">Este día no tiene turnos libres</p>
                  <button onClick={() => setStep('date')} className="text-sm font-semibold" style={{ color: '#F97316' }}>
                    Elegir otro día →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map(t => (
                    <button
                      key={t}
                      onClick={() => handleTimeSelect(t)}
                      className="py-3 rounded-2xl text-sm font-semibold transition-all duration-150"
                      style={selectedTime === t
                        ? { background: 'linear-gradient(135deg,#EA580C,#F97316)', color: '#fff', boxShadow: '0 4px 15px rgba(234,88,12,0.4)' }
                        : { ...glass, color: 'rgba(255,255,255,0.7)' }
                      }
                      onMouseEnter={e => { if (t !== selectedTime) Object.assign(e.currentTarget.style, { background: 'rgba(234,88,12,0.15)', color: '#F97316', border: '1px solid rgba(234,88,12,0.3)' }); }}
                      onMouseLeave={e => { if (t !== selectedTime) Object.assign(e.currentTarget.style, { ...glass, color: 'rgba(255,255,255,0.7)' }); }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: Form ── */}
        {step === 'form' && (
          <div className="space-y-4">
            <button onClick={() => setStep('time')} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#F97316' }}>
              <ChevronLeft size={16} /> Cambiar horario
            </button>

            {/* Summary pill */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: 'rgba(234,88,12,0.12)', border: '1px solid rgba(234,88,12,0.2)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#EA580C,#F97316)' }}>
                <CalendarDays size={14} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-sm text-white capitalize">{formatDateLong(selectedDate)}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>a las {selectedTime} · Consultoría 30 min</p>
              </div>
            </div>

            <div className="rounded-3xl p-6 shadow-2xl" style={{ ...glass, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
              <h2 className="font-bold text-white text-lg mb-5">Tus datos</h2>

              {error && (
                <div className="px-4 py-3 rounded-2xl mb-4 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { field: 'name',  Icon: User,  label: 'Nombre completo', placeholder: 'Juan García', type: 'text' },
                  { field: 'phone', Icon: Phone, label: 'WhatsApp', placeholder: '+5491122334455', type: 'tel' },
                ].map(({ field, Icon, label, placeholder, type }) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {label}
                    </label>
                    <div className="relative">
                      <Icon size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
                      <input
                        type={type}
                        value={form[field]}
                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                        placeholder={placeholder}
                        required
                        className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm text-white placeholder-white/20 outline-none transition-all"
                        style={{ ...glass }}
                        onFocus={e => { e.currentTarget.style.border = '1px solid rgba(234,88,12,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(234,88,12,0.1)'; }}
                        onBlur={e => { e.currentTarget.style.border = glass.border; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    ¿De qué se trata tu proyecto? <span style={{ color: 'rgba(255,255,255,0.2)' }}>(opcional)</span>
                  </label>
                  <div className="relative">
                    <MessageSquare size={15} className="absolute left-4 top-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <textarea
                      rows={3}
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="App mobile, landing page, sistema de gestión..."
                      className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm text-white placeholder-white/20 outline-none resize-none transition-all"
                      style={{ ...glass }}
                      onFocus={e => { e.currentTarget.style.border = '1px solid rgba(234,88,12,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(234,88,12,0.1)'; }}
                      onBlur={e => { e.currentTarget.style.border = glass.border; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg,#EA580C,#F97316)',
                    boxShadow: '0 8px 30px rgba(234,88,12,0.35)',
                    opacity: submitting ? 0.7 : 1,
                  }}
                  onMouseEnter={e => { if (!submitting) e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(234,88,12,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(234,88,12,0.35)'; }}
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <><span>Confirmar consultoría</span><ArrowRight size={16} /></>}
                </button>

                <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  Te confirmamos por WhatsApp con los detalles
                </p>
              </form>
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && bookedApt && (
          <div className="text-center">
            {/* Checkmark */}
            <div className="relative inline-flex mb-8">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#EA580C,#F97316)', boxShadow: '0 20px 60px rgba(234,88,12,0.5)' }}>
                <CheckCircle size={44} className="text-white" />
              </div>
              <div className="absolute -inset-3 rounded-3xl animate-ping" style={{ background: 'rgba(234,88,12,0.1)' }} />
            </div>

            <h2 className="text-3xl font-extrabold text-white mb-2">¡Todo listo!</h2>
            <p className="text-white/50 mb-8">Te mandamos la confirmación por WhatsApp.</p>

            {/* Detail card */}
            <div className="rounded-3xl p-6 text-left mb-6" style={{ ...glass }}>
              {[
                { Icon: User,        label: 'Nombre',  value: bookedApt.name },
                { Icon: CalendarDays,label: 'Fecha',   value: formatDateLong(bookedApt.date), capitalize: true },
                { Icon: Clock,       label: 'Hora',    value: `${bookedApt.time} · 30 minutos` },
              ].map(({ Icon, label, value, capitalize }) => (
                <div key={label} className="flex items-center gap-4 py-3 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(234,88,12,0.12)' }}>
                    <Icon size={16} style={{ color: '#F97316' }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</p>
                    <p className={`font-semibold text-white text-sm ${capitalize ? 'capitalize' : ''}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => { setStep('date'); setSelectedDate(''); setSelectedTime(''); setForm({ name: '', phone: '', notes: '' }); }}
              className="w-full py-3 rounded-2xl font-semibold text-sm transition-all"
              style={{ ...glass, color: 'rgba(255,255,255,0.6)' }}
              onMouseEnter={e => Object.assign(e.currentTarget.style, glassHover)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, { ...glass, color: 'rgba(255,255,255,0.6)' })}
            >
              Reservar otro turno
            </button>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 text-center py-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          © {new Date().getFullYear()} Driva Dev · Soluciones digitales a medida
        </p>
      </footer>
    </div>
  );
}
