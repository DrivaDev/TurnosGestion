import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { tenantConfigs } from '../tenantConfigs';
import DrivaDevBooking from './tenants/DrivaDevBooking';
import {
  CalendarDays, Clock, User, Phone, CheckCircle,
  ChevronLeft, ChevronRight, Loader2, MessageSquare, LayoutGrid, DollarSign, Users, Mail,
} from 'lucide-react';

const CUSTOM_PAGES = { 'driva-dev': DrivaDevBooking };
const BASE = '/api/public';
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_ES   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function toISO(y, m, d) { return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
function todayISO() { return new Date().toISOString().slice(0,10); }
function formatDateLong(dateStr) {
  const [y,m,d] = dateStr.split('-').map(Number);
  const date = new Date(y,m-1,d);
  return `${['domingo','lunes','martes','miércoles','jueves','viernes','sábado'][date.getDay()]} ${d} de ${MONTHS_ES[m-1].toLowerCase()}`;
}
function formatDuration(min) {
  if (!min) return '';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min/60), m = min%60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function DrivaBadge() {
  return (
    <div className="text-center py-6 mt-4">
      <p className="text-xs text-stone-400">
        Desarrollado por{' '}
        <a href="https://drivadev.com" target="_blank" rel="noopener noreferrer"
          className="font-bold" style={{ color: '#EA580C' }}>Driva Dev</a>
        {' '}· Soluciones digitales a medida
      </p>
    </div>
  );
}

export default function BookingPage() {
  const { slug } = useParams();
  const CustomPage = CUSTOM_PAGES[slug];
  if (CustomPage) return <CustomPage />;

  const [business, setBusiness]         = useState(null);
  const [notFound, setNotFound]         = useState(false);
  const [unavailable, setUnavailable]   = useState(null);

  const [step, setStep]                 = useState('service'); // service→staff→date→time→form→success
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStaff, setSelectedStaff]     = useState(null);
  const [staffList, setStaffList]             = useState([]);
  const [loadingStaff, setLoadingStaff]       = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [slots, setSlots]               = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm]                 = useState({ name:'', phone:'', email:'', notes:'' });
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState('');
  const [bookedApt, setBookedApt]       = useState(null);
  const [calDate, setCalDate]           = useState(() => {
    const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() };
  });

  useEffect(() => {
    fetch(`${BASE}/${slug}`)
      .then(async r => {
        if (r.ok) return r.json();
        const d = await r.json().catch(() => ({}));
        if (d.error === 'inactive') setUnavailable('inactive');
        else if (d.error === 'pending') setUnavailable('pending');
        else setNotFound(true);
        return null;
      })
      .then(d => {
        if (!d) return;
        setBusiness(d);
        if (!d.services || d.services.length === 0) setStep('date');
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  // Page title
  useEffect(() => {
    if (business) document.title = `Reservas — ${business.businessName}`;
    return () => { document.title = 'Turnly'; };
  }, [business]);

  async function handleServiceSelect(svc) {
    setSelectedService(svc);
    setSelectedStaff(null);
    setSelectedDate('');
    setSelectedTime('');
    // Load staff for this service
    setLoadingStaff(true);
    try {
      const res = await fetch(`${BASE}/${slug}/staff?serviceId=${svc.id}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setStaffList(list);
      // Skip staff step if no staff configured
      setStep(list.length > 0 ? 'staff' : 'date');
    } catch { setStaffList([]); setStep('date'); }
    finally { setLoadingStaff(false); }
  }

  async function handleDateSelect(dateStr) {
    setSelectedDate(dateStr);
    setSelectedTime('');
    setLoadingSlots(true);
    setStep('time');
    const serviceParam = selectedService ? `&serviceId=${selectedService.id}` : '';
    const staffParam   = selectedStaff   ? `&staffId=${selectedStaff.id}`     : '';
    try {
      const res = await fetch(`${BASE}/${slug}/slots?date=${dateStr}${serviceParam}${staffParam}`);
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
        body: JSON.stringify({
          ...form,
          date: selectedDate,
          time: selectedTime,
          serviceId: selectedService?.id ?? null,
          staffId:   selectedStaff?.id   ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al reservar'); return; }
      setBookedApt({ ...data.appointment, pendingConfirmation: data.pendingConfirmation });
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

  function resetToService() {
    setSelectedService(null); setSelectedStaff(null); setSelectedDate(''); setSelectedTime('');
    setStaffList([]); setForm({ name:'', phone:'', notes:'' });
    setStep(business?.services?.length > 0 ? 'service' : 'date');
  }

  // ── Error states ──────────────────────────────────────────────────────────
  if (unavailable) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: '#FFF7ED' }}>
      <CalendarDays size={48} style={{ color: '#EA580C' }} className="mb-4 opacity-40" />
      <h1 className="text-2xl font-bold mb-2" style={{ color: '#9A3412' }}>
        {unavailable === 'inactive' ? 'Negocio no disponible' : 'Próximamente'}
      </h1>
      <p className="text-stone-500 max-w-xs">
        {unavailable === 'inactive'
          ? 'Este negocio no está tomando turnos en este momento. Volvé más tarde.'
          : 'Esta página de reservas estará disponible muy pronto.'}
      </p>
      <DrivaBadge />
    </div>
  );

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

  // ── Theme ─────────────────────────────────────────────────────────────────
  const codeConfig = tenantConfigs[slug]?.theme || {};
  const theme = {
    primary:   codeConfig.primary   || business.theme?.primary   || '#EA580C',
    secondary: codeConfig.secondary || business.theme?.secondary || '#9A3412',
    accent:    codeConfig.accent    || business.theme?.accent    || '#FED7AA',
    bg:        codeConfig.bg        || business.theme?.bg        || '#FFF7ED',
    logo:      codeConfig.logo      || business.theme?.logo      || '',
  };

  const hasServices = business.services?.length > 0;
  const hasStaff    = staffList.length > 0;
  const STEPS = hasServices
    ? (hasStaff ? ['service','staff','date','time','form'] : ['service','date','time','form'])
    : ['date','time','form'];
  const stepLabels = { service: 'Servicio', staff: 'Profesional', date: 'Fecha', time: 'Horario', form: 'Datos' };
  const stepIcons  = { service: LayoutGrid, staff: Users, date: CalendarDays, time: Clock, form: User };

  const today = todayISO();
  const firstDay   = new Date(calDate.year, calDate.month, 1).getDay();
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
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-1">
            {STEPS.map((id, i) => {
              const idx   = STEPS.indexOf(step);
              const myIdx = i;
              const done  = myIdx < idx;
              const active = myIdx === idx;
              const Icon  = stepIcons[id];
              return (
                <div key={id} className="flex items-center gap-1 flex-1">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors`}
                      style={done || active ? { background: theme.primary, color: '#fff' } : { background: '#f5f5f4', color: '#a8a29e' }}>
                      {done ? '✓' : <Icon size={13} />}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${active ? 'text-stone-800' : done ? 'text-stone-500' : 'text-stone-400'}`}>
                      {stepLabels[id]}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-px mx-1" style={{ background: myIdx < idx ? theme.primary : theme.accent }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">

        {/* ── Step: Service ── */}
        {step === 'service' && (
          <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: theme.accent }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: theme.secondary }}>¿Qué servicio necesitás?</h2>
            <div className="space-y-2">
              {business.services.map(svc => (
                <button
                  key={svc.id}
                  onClick={() => handleServiceSelect(svc)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:shadow-sm"
                  style={{ borderColor: theme.accent }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.background = theme.accent + '40'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.background = ''; }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: theme.accent }}>
                    <LayoutGrid size={18} style={{ color: theme.secondary }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-stone-800">{svc.name}</p>
                    {svc.description && <p className="text-xs text-stone-500 mt-0.5 truncate">{svc.description}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-medium flex items-center gap-1" style={{ color: theme.secondary }}>
                        <Clock size={11} /> {formatDuration(svc.durationMin)}
                      </span>
                      {svc.price != null && (
                        <span className="text-xs font-medium flex items-center gap-1" style={{ color: theme.secondary }}>
                          <DollarSign size={11} /> ${Number(svc.price).toLocaleString('es-AR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={18} style={{ color: theme.primary }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step: Staff ── */}
        {step === 'staff' && (
          <div className="space-y-4">
            <button onClick={() => setStep('service')} className="flex items-center gap-1 text-sm font-medium hover:underline" style={{ color: theme.primary }}>
              <ChevronLeft size={16} /> Cambiar servicio
            </button>
            {selectedService && (
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm" style={{ background: theme.accent }}>
                <LayoutGrid size={14} style={{ color: theme.secondary }} />
                <span className="font-semibold" style={{ color: theme.secondary }}>{selectedService.name}</span>
              </div>
            )}
            <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: theme.accent }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: theme.secondary }}>¿Con quién querés reservar?</h2>
              {loadingStaff ? (
                <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin" style={{ color: theme.primary }} /></div>
              ) : (
                <div className="space-y-2">
                  {staffList.map(sf => (
                    <button key={sf.id}
                      onClick={() => { setSelectedStaff(sf); setStep('date'); }}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:shadow-sm"
                      style={{ borderColor: theme.accent }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.background = theme.accent + '40'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.background = ''; }}
                    >
                      {sf.photo
                        ? <img src={sf.photo} alt={sf.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                        : <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-bold text-white text-base"
                            style={{ background: `linear-gradient(135deg,${theme.primary},${theme.secondary})` }}>
                            {sf.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                          </div>
                      }
                      <div className="flex-1">
                        <p className="font-bold text-stone-800">{sf.name}</p>
                      </div>
                      <ChevronRight size={18} style={{ color: theme.primary }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step: Date ── */}
        {step === 'date' && (
          <div className="space-y-4">
            {hasStaff && selectedStaff ? (
              <button onClick={() => setStep('staff')} className="flex items-center gap-1 text-sm font-medium hover:underline" style={{ color: theme.primary }}>
                <ChevronLeft size={16} /> Cambiar profesional
              </button>
            ) : hasServices ? (
              <button onClick={() => setStep('service')} className="flex items-center gap-1 text-sm font-medium hover:underline" style={{ color: theme.primary }}>
                <ChevronLeft size={16} /> Cambiar servicio
              </button>
            ) : null}
            {(selectedService || selectedStaff) && (
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm flex-wrap" style={{ background: theme.accent }}>
                {selectedService && <><LayoutGrid size={14} style={{ color: theme.secondary }} /><span className="font-semibold" style={{ color: theme.secondary }}>{selectedService.name}</span><span className="text-stone-500 text-xs">· {formatDuration(selectedService.durationMin)}</span></>}
                {selectedStaff && <><Users size={14} style={{ color: theme.secondary }} /><span className="font-semibold" style={{ color: theme.secondary }}>{selectedStaff.name}</span></>}
              </div>
            )}
            <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: theme.accent }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: theme.secondary }}>¿Qué día te queda bien?</h2>
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => shiftMonth(-1)} className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
                  <ChevronLeft size={18} style={{ color: theme.secondary }} />
                </button>
                <span className="font-semibold text-stone-800">{MONTHS_ES[calDate.month]} {calDate.year}</span>
                <button onClick={() => shiftMonth(1)} className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
                  <ChevronRight size={18} style={{ color: theme.secondary }} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {DAYS_ES.map(d => <div key={d} className="text-xs font-medium text-stone-400 py-1">{d}</div>)}
                {Array.from({ length: offset }).map((_, i) => <div key={`o${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i+1).map(day => {
                  const dateStr = toISO(calDate.year, calDate.month, day);
                  const isPast  = dateStr < today;
                  const isToday = dateStr === today;
                  const isSel   = dateStr === selectedDate;
                  return (
                    <button key={day} disabled={isPast} onClick={() => handleDateSelect(dateStr)}
                      className={`py-2.5 text-sm rounded-xl transition-all font-medium ${isPast ? 'text-stone-300 cursor-not-allowed' : isSel ? 'text-white font-bold' : 'hover:text-white'}`}
                      style={isSel ? { background: theme.primary } : isToday ? { color: theme.primary } : {}}
                      onMouseEnter={e => { if (!isPast && !isSel) e.currentTarget.style.background = theme.accent; }}
                      onMouseLeave={e => { if (!isPast && !isSel) e.currentTarget.style.background = ''; }}
                    >{day}</button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Step: Time ── */}
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
                  <button onClick={() => setStep('date')} className="mt-4 text-sm font-semibold underline" style={{ color: theme.primary }}>Elegir otro día</button>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map(t => (
                    <button key={t} onClick={() => handleTimeSelect(t)}
                      className="py-2.5 rounded-xl text-sm font-semibold border transition-all"
                      style={selectedTime === t
                        ? { background: theme.primary, borderColor: theme.primary, color: '#fff' }
                        : { borderColor: theme.accent, color: '#57534e', background: '#fff' }
                      }
                      onMouseEnter={e => { if (t !== selectedTime) { e.currentTarget.style.background = theme.accent; e.currentTarget.style.borderColor = theme.primary; } }}
                      onMouseLeave={e => { if (t !== selectedTime) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = theme.accent; } }}
                    >{t}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step: Form ── */}
        {step === 'form' && (
          <div className="space-y-4">
            <button onClick={() => setStep('time')} className="flex items-center gap-1 text-sm font-medium hover:underline" style={{ color: theme.primary }}>
              <ChevronLeft size={16} /> Cambiar horario
            </button>
            <div className="rounded-2xl p-4 space-y-1" style={{ background: theme.accent }}>
              {selectedService && (
                <div className="flex items-center gap-2 text-sm">
                  <LayoutGrid size={14} style={{ color: theme.secondary }} />
                  <span className="font-bold" style={{ color: theme.secondary }}>{selectedService.name}</span>
                  <span className="text-stone-500 text-xs">· {formatDuration(selectedService.durationMin)}</span>
                  {selectedService.price != null && <span className="text-stone-500 text-xs">· ${Number(selectedService.price).toLocaleString('es-AR')}</span>}
                </div>
              )}
              {selectedStaff && (
                <div className="flex items-center gap-2 text-sm">
                  <Users size={14} style={{ color: theme.secondary }} />
                  <span className="font-bold" style={{ color: theme.secondary }}>{selectedStaff.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays size={14} style={{ color: theme.secondary }} />
                <span className="font-bold capitalize" style={{ color: theme.secondary }}>{formatDateLong(selectedDate)}</span>
                <span className="text-stone-500 text-xs">a las <strong>{selectedTime}</strong></span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: theme.accent }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: theme.secondary }}>Tus datos</h2>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1C1917' }}><User size={14} className="inline mr-1" /> Nombre completo *</label>
                  <input className="brand-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Juan Pérez" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1C1917' }}><Phone size={14} className="inline mr-1" /> WhatsApp *</label>
                  <input className="brand-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+5491122334455" required />
                  <p className="text-xs text-stone-400 mt-1">Con código de país. Ej: +5491122334455</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1C1917' }}><Mail size={14} className="inline mr-1" /> Email (para confirmación)</label>
                  <input type="email" className="brand-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="tu@email.com" />
                  <p className="text-xs text-stone-400 mt-1">Te enviaremos la confirmación y un recordatorio por email.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1C1917' }}><MessageSquare size={14} className="inline mr-1" /> Notas (opcional)</label>
                  <textarea className="brand-input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Alguna indicación especial..." />
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
            <h2 className="text-2xl font-bold mb-2" style={{ color: theme.secondary }}>
              {bookedApt.pendingConfirmation ? '¡Solicitud recibida!' : '¡Turno confirmado!'}
            </h2>
            <p className="text-stone-500 mb-6">
              {bookedApt.pendingConfirmation
                ? 'Tu turno está pendiente de confirmación. Te avisaremos por email cuando sea confirmado.'
                : form.email ? 'Te enviamos la confirmación por email.' : '¡Tu turno está reservado!'}
            </p>
            <div className="w-full rounded-2xl p-5 text-left space-y-3 mb-6" style={{ background: theme.accent }}>
              {selectedService && (
                <div className="flex items-center gap-3">
                  <LayoutGrid size={18} style={{ color: theme.secondary }} />
                  <div><p className="text-xs text-stone-500">Servicio</p><p className="font-semibold" style={{ color: '#1C1917' }}>{selectedService.name}</p></div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <User size={18} style={{ color: theme.secondary }} />
                <div><p className="text-xs text-stone-500">Nombre</p><p className="font-semibold" style={{ color: '#1C1917' }}>{bookedApt.name}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays size={18} style={{ color: theme.secondary }} />
                <div><p className="text-xs text-stone-500">Fecha</p><p className="font-semibold capitalize" style={{ color: '#1C1917' }}>{formatDateLong(bookedApt.date)}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={18} style={{ color: theme.secondary }} />
                <div><p className="text-xs text-stone-500">Hora</p><p className="font-semibold" style={{ color: '#1C1917' }}>{bookedApt.time}</p></div>
              </div>
            </div>
            <button onClick={resetToService} className="brand-btn px-8">Reservar otro turno</button>
          </div>
        )}
      </main>

      <DrivaBadge />
    </div>
  );
}
