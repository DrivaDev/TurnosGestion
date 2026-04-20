import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, MessageSquare, Clock, Zap, Shield, BarChart2,
  ArrowRight, CheckCircle2, Star,
} from 'lucide-react';

const FEATURES = [
  {
    icon: CalendarDays,
    title: 'Agenda online 24/7',
    desc: 'Tus clientes reservan cuando quieren, sin llamadas ni mensajes. La agenda se actualiza sola.',
  },
  {
    icon: MessageSquare,
    title: 'Confirmaciones por email',
    desc: 'Cada turno dispara un email automático al cliente con los detalles de su reserva.',
  },
  {
    icon: Clock,
    title: 'Recordatorios automáticos',
    desc: 'Se envía un recordatorio por email antes del turno. Menos ausencias, más ingresos.',
  },
  {
    icon: BarChart2,
    title: 'Panel de gestión',
    desc: 'Ves todos tus turnos del día, confirmás, cancelás y agregás nuevos desde el panel.',
  },
  {
    icon: Shield,
    title: '100% personalizable',
    desc: 'Tu página con tus colores, logo, tipografía y contenido. Diseñada a medida por Driva Dev.',
  },
  {
    icon: Zap,
    title: 'Listo en minutos',
    desc: 'Te creamos la cuenta, configuramos tu horario y en el día ya estás tomando turnos.',
  },
];

const STEPS = [
  { num: '01', title: 'Contactanos', desc: 'Escribinos por WhatsApp y coordinamos una llamada corta.' },
  { num: '02', title: 'Configuramos todo', desc: 'Nosotros armamos tu página con tus colores, horarios y datos.' },
  { num: '03', title: 'Empezás a recibir turnos', desc: 'Compartís el link y tus clientes ya pueden reservar.' },
];

const TESTIMONIALS = [
  { name: 'Peluquería El Corte', text: 'Desde que lo usamos no tenemos que responder más mensajes preguntando horarios. Un antes y un después.', stars: 5 },
  { name: 'Centro de Estética', text: 'Mis clientes aman poder reservar a cualquier hora. Los recordatorios redujeron los ausentes a casi cero.', stars: 5 },
  { name: 'Consultorio Nutrición', text: 'La gestión de turnos ahora me lleva 5 minutos por día. Antes era un caos de mensajes de WhatsApp.', stars: 5 },
];

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Turnly',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'Sistema de gestión de turnos online para negocios locales. Página de reservas personalizada, confirmaciones y recordatorios automáticos por WhatsApp.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'ARS', description: 'Consultar precio según plan' },
  author: { '@type': 'Organization', name: 'Driva Dev', url: 'https://drivadev.com' },
  url: 'https://turnosgestion.vercel.app',
};

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Turnly — Sistema de turnos online para negocios | Driva Dev';
    // Inject JSON-LD
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id   = 'landing-jsonld';
    script.text = JSON.stringify(JSON_LD);
    document.head.appendChild(script);
    return () => { document.getElementById('landing-jsonld')?.remove(); };
  }, []);

  return (
    <div className="min-h-screen font-sans" style={{ background: '#0A0A0A', color: '#fff' }}>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute" style={{
          top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: '900px', height: '700px',
          background: 'radial-gradient(ellipse, rgba(234,88,12,0.10) 0%, transparent 70%)',
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* ── Nav ── */}
      <nav className="relative z-10 max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#EA580C,#F97316)' }}>
            <CalendarDays size={16} className="text-white" />
          </div>
          <span className="font-bold text-white text-base tracking-tight">Turnly</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="text-sm font-medium px-4 py-2 rounded-xl transition-colors" style={{ color: 'rgba(255,255,255,0.6)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          >
            Ingresar
          </button>
          <button
            onClick={() => navigate('/register')}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#EA580C,#F97316)' }}
          >
            Quiero mi sistema <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6"
          style={{ background: 'rgba(234,88,12,0.12)', color: '#F97316', border: '1px solid rgba(234,88,12,0.2)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
          Sistema activo · Negocios usando la plataforma ahora mismo
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6">
          Tu negocio toma turnos{' '}
          <span style={{ background: 'linear-gradient(135deg,#EA580C,#F97316,#FDBA74)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            solo
          </span>
        </h1>
        <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
          Página de reservas personalizada, confirmaciones y recordatorios por WhatsApp,
          y un panel para gestionar todo. Sin apps, sin complicaciones.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/register')}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-base transition-all"
            style={{ background: 'linear-gradient(135deg,#EA580C,#F97316)', boxShadow: '0 8px 30px rgba(234,88,12,0.35)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(234,88,12,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(234,88,12,0.35)'; }}
          >
            <ArrowRight size={18} /> Quiero mi sistema
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-4 rounded-2xl font-semibold text-base transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.7)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
          >
            Ya tengo cuenta → Ingresar
          </button>
        </div>

        {/* Primer mes gratis callout */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl mt-8"
          style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <span className="text-lg">🎁</span>
          <span className="text-sm font-semibold" style={{ color: '#4ade80' }}>Primer mes gratis en el Plan Básico</span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>· sin tarjeta de crédito</span>
        </div>

        {/* Social proof strip */}
        <div className="flex items-center justify-center gap-6 mt-6 flex-wrap">
          {['Sin contrato de permanencia', 'Configuración incluida', 'Soporte por WhatsApp'].map(t => (
            <div key={t} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <CheckCircle2 size={13} style={{ color: '#22c55e' }} />
              {t}
            </div>
          ))}
        </div>
      </section>

      {/* ── Mock preview ── */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-20">
        <div className="rounded-3xl overflow-hidden border" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)' }}>
          {/* Fake browser bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
            <div className="flex-1 mx-4 px-3 py-1 rounded-lg text-xs text-center" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
              turnosgestion.vercel.app/book/tu-negocio
            </div>
          </div>
          {/* Mini page preview */}
          <div className="p-6" style={{ background: 'rgba(234,88,12,0.06)' }}>
            <div className="h-16 rounded-2xl flex items-center px-5 gap-3 mb-4" style={{ background: 'linear-gradient(135deg,#EA580C,#9A3412)' }}>
              <div className="w-9 h-9 rounded-full bg-white/20" />
              <div>
                <div className="h-3 w-28 rounded bg-white/80 mb-1.5" />
                <div className="h-2 w-20 rounded bg-white/40" />
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-3">
              {['L','M','M','J','V','S','D'].map(d => (
                <div key={d} className="text-center text-xs font-semibold py-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{d}</div>
              ))}
              {Array.from({ length: 28 }, (_, i) => (
                <div key={i} className={`py-2 rounded-lg text-center text-xs font-medium ${i === 11 ? 'text-white' : 'text-white/30'}`}
                  style={i === 11 ? { background: 'linear-gradient(135deg,#EA580C,#F97316)' } : {}}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {['09:00','10:00','11:00','14:00','15:00','16:00','17:00','18:00'].map((t, i) => (
                <div key={t} className="py-2 rounded-xl text-center text-xs font-semibold"
                  style={i === 2
                    ? { background: 'linear-gradient(135deg,#EA580C,#F97316)', color: '#fff' }
                    : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }
                  }
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Todo lo que necesitás</h2>
          <p className="text-white/40 text-lg">Sin apps extra, sin complicaciones técnicas.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl p-5 transition-all group" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(234,88,12,0.06)'; e.currentTarget.style.border = '1px solid rgba(234,88,12,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)'; }}
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(234,88,12,0.12)' }}>
                <Icon size={20} style={{ color: '#F97316' }} />
              </div>
              <h3 className="font-bold text-white mb-1.5">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Customization highlight ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(234,88,12,0.06)', border: '1px solid rgba(234,88,12,0.15)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="p-10 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5 w-fit" style={{ background: 'rgba(234,88,12,0.15)', color: '#F97316', border: '1px solid rgba(234,88,12,0.25)' }}>
                <Zap size={12} /> Diferencial Driva Dev
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-4 leading-tight">
                Tu página,<br />
                <span style={{ background: 'linear-gradient(135deg,#EA580C,#F97316,#FDBA74)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  100% única
                </span>
              </h2>
              <p className="text-white/50 leading-relaxed mb-6">
                No somos un constructor de páginas con plantillas. Nosotros diseñamos y programamos
                la página de reservas de tu negocio <strong className="text-white/70">desde cero</strong>.
                Colores, logo, tipografía, secciones, textos — todo como vos lo imaginás.
              </p>
              <div className="space-y-2">
                {[
                  'Colores y logo de tu marca',
                  'Diseño exclusivo, sin plantillas genéricas',
                  'Actualizable cuando lo necesites',
                  'Optimizada para mobile',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    <CheckCircle2 size={15} style={{ color: '#22c55e' }} className="shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            {/* Visual right side */}
            <div className="p-8 flex items-center justify-center" style={{ borderLeft: '1px solid rgba(234,88,12,0.1)' }}>
              <div className="w-full max-w-xs space-y-3">
                {[
                  { color: '#EA580C', label: 'Negocio A — naranja' },
                  { color: '#2563EB', label: 'Negocio B — azul' },
                  { color: '#16A34A', label: 'Negocio C — verde' },
                  { color: '#9333EA', label: 'Negocio D — violeta' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="w-8 h-8 rounded-xl shrink-0" style={{ background: color }} />
                    <div>
                      <div className="h-2 w-24 rounded mb-1.5" style={{ background: color, opacity: 0.6 }} />
                      <div className="h-1.5 w-16 rounded" style={{ background: 'rgba(255,255,255,0.15)' }} />
                    </div>
                    <span className="text-xs ml-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>{label.split('—')[1]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">¿Cómo funciona?</h2>
          <p className="text-white/40 text-lg">Tres pasos y estás listo.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STEPS.map(({ num, title, desc }) => (
            <div key={num} className="text-center">
              <div className="text-5xl font-extrabold mb-3" style={{ background: 'linear-gradient(135deg,#EA580C,#F97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {num}
              </div>
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Precio simple y claro</h2>
          <p className="text-white/40 text-lg">Sin sorpresas, sin letras chicas. Primer mes gratis en el Plan Básico.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Basic */}
          <div className="rounded-3xl p-7 flex flex-col" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold self-start" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}>
                Plan Básico
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold self-start" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}>
                🎁 1er mes gratis
              </div>
            </div>
            <p className="text-4xl font-extrabold text-white mb-1">$20.000<span className="text-lg font-medium text-white/40">/mes</span></p>
            <p className="text-white/40 text-sm mb-5">Para negocios individuales.</p>
            <div className="space-y-2 flex-1">
              {['🎁 1er mes completamente gratis','Página de reservas personalizada','Panel de gestión completo','Confirmaciones y recordatorios por email','Diseño 100% personalizado','Soporte por WhatsApp'].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  <CheckCircle2 size={14} style={{ color: 'rgba(255,255,255,0.4)' }} className="shrink-0" /> {f}
                </div>
              ))}
            </div>
            <button onClick={() => window.location.href = '/register'}
              className="w-full mt-6 py-3.5 rounded-2xl font-bold text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
              Empezar gratis
            </button>
          </div>

          {/* Pro */}
          <div className="rounded-3xl p-7 flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(234,88,12,0.18), rgba(249,115,22,0.10))', border: '1px solid rgba(234,88,12,0.35)' }}>
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(234,88,12,0.18) 0%, transparent 70%)', transform: 'translate(20%,-20%)' }} />
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold self-start" style={{ background: 'linear-gradient(135deg,#EA580C,#F97316)', color: '#fff' }}>
                ⚡ Plan Pro
              </div>
            </div>
            <p className="text-4xl font-extrabold text-white mb-1">$30.000<span className="text-lg font-medium text-white/40">/mes</span></p>
            <p className="text-white/40 text-sm mb-5">Para equipos de hasta 5 profesionales.</p>
            <div className="space-y-2 flex-1">
              {['Todo lo del Plan Básico','Hasta 5 profesionales/usuarios','Cada uno con su propia agenda','El cliente elige con quién reservar','Perfiles editables con foto y servicios','Servicios por profesional'].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <CheckCircle2 size={14} style={{ color: '#F97316' }} className="shrink-0" /> {f}
                </div>
              ))}
            </div>
            <button onClick={() => window.location.href = '/register'}
              className="w-full mt-6 py-3.5 rounded-2xl font-bold text-sm text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#EA580C,#F97316)', boxShadow: '0 8px 25px rgba(234,88,12,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 12px 35px rgba(234,88,12,0.5)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 8px 25px rgba(234,88,12,0.3)'}>
              Empezar gratis
            </button>
          </div>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Precios en pesos argentinos · El pago se realiza directamente con Driva Dev · Sin contrato de permanencia
        </p>
      </section>

      {/* ── Testimonials ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Lo que dicen los negocios</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TESTIMONIALS.map(({ name, text, stars }) => (
            <div key={name} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} size={14} fill="#F97316" style={{ color: '#F97316' }} />
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>"{text}"</p>
              <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>{name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 max-w-2xl mx-auto px-6 pb-24 text-center">
        <div className="rounded-3xl p-10" style={{ background: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.15)' }}>
          <h2 className="text-3xl font-extrabold mb-3">¿Listo para empezar?</h2>
          <p className="mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Escribinos por WhatsApp y en menos de 24hs tu negocio está tomando turnos online.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-base transition-all"
              style={{ background: 'linear-gradient(135deg,#EA580C,#F97316)', boxShadow: '0 8px 30px rgba(234,88,12,0.4)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(234,88,12,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(234,88,12,0.4)'; }}
            >
              <ArrowRight size={18} /> Crear mi cuenta
            </button>
            <a
              href="https://wa.me/5491139139022?text=Hola!%20Quiero%20saber%20más%20sobre%20Turnly"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
            >
              <MessageSquare size={18} /> Tengo dudas, escribinos
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t text-center py-8 px-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#EA580C,#F97316)' }}>
            <CalendarDays size={12} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm">Turnly</span>
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Desarrollado por{' '}
          <a href="https://drivadev.com" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#F97316' }}>
            Driva Dev
          </a>
          {' '}· Soluciones digitales a medida
        </p>
      </footer>
    </div>
  );
}
