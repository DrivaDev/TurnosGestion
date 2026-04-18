import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.login(form);
      login(token, user);
      navigate('/dashboard');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: '#FFF7ED' }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border" style={{ borderColor: '#FED7AA' }}>
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-2xl mb-3" style={{ background: '#EA580C' }}>
            <CalendarDays className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#9A3412' }}>Gestor de Turnos</h1>
          <p className="text-stone-500 text-sm mt-1">Iniciá sesión en tu cuenta</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1C1917' }}>Email</label>
            <input
              className="brand-input"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="tu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1C1917' }}>Contraseña</label>
            <input
              className="brand-input"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="brand-btn w-full py-3 mt-2" disabled={loading}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            Iniciar sesión
          </button>
        </form>

        <p className="text-center text-sm text-stone-500 mt-6">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="font-semibold hover:underline" style={{ color: '#EA580C' }}>
            Registrá tu negocio
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
