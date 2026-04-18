import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function Register() {
  const [form, setForm]     = useState({ businessName: '', name: '', email: '', password: '' });
  const [error, setError]   = useState('');
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
      const { token, user } = await api.register(form);
      login(token, user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-xl mb-3">
            <CalendarDays className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
          <p className="text-gray-500 text-sm mt-1">Registrá tu negocio gratis</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nombre del negocio</label>
            <input className="input" value={form.businessName}
              onChange={e => set('businessName', e.target.value)}
              placeholder="Ej: Peluquería Martín" required />
          </div>
          <div>
            <label className="label">Tu nombre</label>
            <input className="input" value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Juan Pérez" required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" autoComplete="email"
              value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="tu@email.com" required />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input className="input" type="password" autoComplete="new-password"
              value={form.password} onChange={e => set('password', e.target.value)}
              placeholder="Mínimo 6 caracteres" required />
          </div>
          <button type="submit" className="btn-primary w-full justify-center py-2.5 mt-2" disabled={loading}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            Crear cuenta
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
