import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, CalendarDays } from 'lucide-react';

export default function CancelPage() {
  const { token } = useParams();
  const [state, setState] = useState('loading'); // loading | success | already | error
  const [apt, setApt] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/public/cancel/${token}`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setState('error'); return; }
        if (data.alreadyCancelled) { setState('already'); return; }
        setApt(data);
        setState('success');
      })
      .catch(() => { setError('Error de conexión.'); setState('error'); });
  }, [token]);

  function formatDate(d) {
    if (!d) return '';
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: '#FFF7ED' }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
        <div className="flex justify-center mb-2">
          <CalendarDays size={32} style={{ color: '#EA580C' }} />
        </div>
        <p className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Turnly</p>

        {state === 'loading' && (
          <>
            <Loader2 size={28} className="animate-spin mx-auto text-orange-500" />
            <p className="text-stone-500 text-sm">Procesando cancelación...</p>
          </>
        )}

        {state === 'success' && (
          <>
            <CheckCircle2 size={40} className="mx-auto text-green-500" />
            <h1 className="text-xl font-bold text-gray-900">Turno cancelado</h1>
            {apt && (
              <p className="text-stone-500 text-sm">
                El turno de <strong>{apt.name}</strong> para el <strong>{formatDate(apt.date)}</strong> a las <strong>{apt.time}</strong> fue cancelado exitosamente.
              </p>
            )}
          </>
        )}

        {state === 'already' && (
          <>
            <XCircle size={40} className="mx-auto text-gray-400" />
            <h1 className="text-xl font-bold text-gray-900">Ya estaba cancelado</h1>
            <p className="text-stone-500 text-sm">Este turno ya fue cancelado anteriormente.</p>
          </>
        )}

        {state === 'error' && (
          <>
            <XCircle size={40} className="mx-auto text-red-400" />
            <h1 className="text-xl font-bold text-gray-900">Enlace inválido</h1>
            <p className="text-stone-500 text-sm">{error || 'No se pudo encontrar el turno asociado a este enlace.'}</p>
          </>
        )}
      </div>
    </div>
  );
}
