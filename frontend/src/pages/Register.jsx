import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Loader2, CheckCircle2, Star, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const PLANS = [
  {
    id: 'basic',
    label: 'Plan Básico',
    icon: Star,
    price: '$20.000',
    badge: '🎁 1er mes gratis',
    features: ['Página de reservas personalizada', 'Confirmaciones y recordatorios por email', 'Panel de gestión completo'],
  },
  {
    id: 'pro',
    label: 'Plan Pro',
    icon: Zap,
    price: '$30.000',
    badge: 'Recomendado para equipos',
    features: ['Todo lo del Plan Básico', 'Hasta 5 profesionales', 'Sistema apto para reservas con seña'],
  },
];

export default function Register() {
  const [plan, setPlan]       = useState('basic');
  const [form, setForm]       = useState({ businessName: '', name: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    setLoading(true);
    try {
      const { token, user } = await api.register({ ...form, plan });
      login(token, user);
      navigate('/dashboard');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 py-10" style={{ background: '#FFF7ED' }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 border" style={{ borderColor: '#FED7AA' }}>
        <div className="flex flex-col items-center mb-7">
          <div className="p-3 rounded-2xl mb-3" style={{ background: '#EA580C' }}>
            <CalendarDays className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#9A3412' }}>Crear cuenta</h1>
          <p className="text-stone-500 text-sm mt-1">Registrá tu negocio y empezá a tomar turnos</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
            {error}
          </div>
        )}

        {/* Plan selector */}
        <div className="mb-6">
          <label className="block text-sm font-bold mb-3" style={{ color: '#1C1917' }}>Elegí tu plan</label>
          <div className="grid grid-cols-2 gap-3">
            {PLANS.map(p => {
              const Icon = p.icon;
              const selected = plan === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlan(p.id)}
                  className="text-left p-4 rounded-xl border-2 transition-all"
                  style={selected
                    ? { borderColor: '#EA580C', background: '#FFF7ED' }
                    : { borderColor: '#e7e5e4', background: '#fff' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                      style={selected ? { borderColor: '#EA580C', background: '#EA580C' } : { borderColor: '#d6d3d1' }}>
                      {selected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                    </div>
                    <Icon size={14} style={{ color: selected ? '#EA580C' : '#a8a29e' }} />
                    <span className="text-sm font-bold" style={{ color: selected ? '#9A3412' : '#57534e' }}>{p.label}</span>
                  </div>
                  <p className="text-base font-extrabold mb-1" style={{ color: '#1C1917' }}>
                    {p.price}<span className="text-xs font-normal text-stone-400">/mes</span>
                  </p>
                  <p className="text-xs font-semibold mb-2" style={{ color: selected ? '#EA580C' : '#a8a29e' }}>{p.badge}</p>
                  <ul className="space-y-1">
                    {p.features.map(f => (
                      <li key={f} className="flex items-start gap-1.5 text-xs" style={{ color: '#78716c' }}>
                        <CheckCircle2 size={11} className="shrink-0 mt-0.5" style={{ color: selected ? '#EA580C' : '#a8a29e' }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
          {plan === 'basic' && (
            <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-2">
              🎁 El primer mes es completamente gratis, sin tarjeta de crédito.
            </p>
          )}
          {plan === 'pro' && (
            <p className="text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 mt-2">
              El Plan Pro se activa una vez realizado el primer pago. Podés explorar el sistema antes.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'businessName', label: 'Nombre del negocio', placeholder: 'Ej: Peluquería Martín' },
            { key: 'name',         label: 'Tu nombre',          placeholder: 'Juan Pérez' },
            { key: 'email',        label: 'Email',              placeholder: 'tu@email.com', type: 'email' },
            { key: 'password',     label: 'Contraseña',         placeholder: 'Mínimo 6 caracteres', type: 'password' },
          ].map(({ key, label, placeholder, type = 'text' }) => (
            <div key={key}>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1C1917' }}>{label}</label>
              <input
                className="brand-input"
                type={type}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                required
              />
            </div>
          ))}
          <button type="submit" className="brand-btn w-full py-3 mt-2" disabled={loading}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            Crear cuenta
          </button>
        </form>

        <p className="text-center text-sm text-stone-500 mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: '#EA580C' }}>
            Iniciá sesión
          </Link>
        </p>
      </div>

      <p className="text-xs text-stone-400 mt-6">
        Desarrollado por{' '}
        <a href="https://drivadev.com" target="_blank" rel="noopener noreferrer"
          className="font-bold" style={{ color: '#EA580C' }}>
          Driva Dev
        </a>
      </p>
    </div>
  );
}
