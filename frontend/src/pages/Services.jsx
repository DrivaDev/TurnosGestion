import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Loader2, Clock, DollarSign, LayoutGrid } from 'lucide-react';
import { api } from '../api';

function ServiceModal({ service, onClose, onSave }) {
  const [form, setForm] = useState({
    name:        service?.name        ?? '',
    description: service?.description ?? '',
    durationMin: service?.durationMin ?? 30,
    price:       service?.price       ?? '',
    active:      service?.active      ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  async function handleSave() {
    if (!form.name.trim()) { setError('El nombre es requerido'); return; }
    if (!form.durationMin || form.durationMin < 5) { setError('La duración mínima es 5 minutos'); return; }
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  const DURATIONS = [5,10,15,20,30,45,60,90,120];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border" style={{ borderColor: '#FED7AA' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg" style={{ color: '#9A3412' }}>
            {service ? 'Editar servicio' : 'Nuevo servicio'}
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X size={20} /></button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-stone-700">Nombre del servicio *</label>
            <input
              className="input"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Corte de pelo, Corte + barba, Tinte..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-stone-700">Descripción (opcional)</label>
            <input
              className="input"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Breve descripción para el cliente"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-stone-700">Duración *</label>
            <div className="grid grid-cols-5 gap-2">
              {DURATIONS.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, durationMin: d }))}
                  className="py-2 rounded-xl text-sm font-semibold border transition-colors"
                  style={form.durationMin === d
                    ? { background: '#EA580C', borderColor: '#EA580C', color: '#fff' }
                    : { background: '#fff', borderColor: '#e7e5e4', color: '#57534e' }
                  }
                >
                  {d < 60 ? `${d}m` : `${d/60}h`}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="5"
              className="input mt-2"
              value={form.durationMin}
              onChange={e => setForm(f => ({ ...f, durationMin: Number(e.target.value) }))}
              placeholder="O escribí los minutos manualmente"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-stone-700">Precio (opcional)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                className="input pl-7"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="0"
              />
            </div>
            <p className="text-xs text-stone-400 mt-1">Se mostrará al cliente al momento de reservar.</p>
          </div>

          {service && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-stone-700">Servicio activo</label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                className={`w-11 h-6 rounded-full transition-colors relative ${form.active ? 'bg-orange-500' : 'bg-stone-300'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow ${form.active ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors"
            style={{ background: '#EA580C' }}
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // null | 'new' | service object
  const [toast, setToast]       = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  async function load() {
    const data = await api.get('/services');
    setServices(data);
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  async function handleSave(form) {
    if (modal?.id) {
      await api.put(`/services/${modal.id}`, form);
      showToast('Servicio actualizado');
    } else {
      await api.post('/services', form);
      showToast('Servicio creado');
    }
    await load();
  }

  async function handleDelete(svc) {
    if (!confirm(`¿Eliminar "${svc.name}"?`)) return;
    await api.delete(`/services/${svc.id}`);
    showToast('Servicio eliminado');
    await load();
  }

  function formatDuration(min) {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60), m = min % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
          <p className="text-stone-500 text-sm mt-0.5">Definí qué servicios ofrecés y cuánto tiempo dura cada uno.</p>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors"
          style={{ background: '#EA580C' }}
        >
          <Plus size={16} /> Nuevo servicio
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-orange-500" /></div>
      ) : services.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-2xl border-stone-200">
          <LayoutGrid size={40} className="mx-auto mb-3 text-stone-300" />
          <h3 className="font-semibold text-stone-500 mb-1">Sin servicios aún</h3>
          <p className="text-sm text-stone-400 mb-4">Creá tu primer servicio para que los clientes puedan elegir al reservar.</p>
          <button onClick={() => setModal('new')} className="text-sm font-semibold hover:underline" style={{ color: '#EA580C' }}>
            + Crear primer servicio
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map(svc => (
            <div key={svc.id} className={`rounded-2xl border p-4 flex items-center gap-4 transition-opacity ${svc.active ? '' : 'opacity-50'}`} style={{ borderColor: '#FED7AA', background: '#FFFBF7' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FED7AA' }}>
                <LayoutGrid size={18} style={{ color: '#9A3412' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-stone-800">{svc.name}</span>
                  {!svc.active && <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-400">inactivo</span>}
                </div>
                {svc.description && <p className="text-xs text-stone-500 mt-0.5 truncate">{svc.description}</p>}
                <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
                  <span className="flex items-center gap-1"><Clock size={11} /> {formatDuration(svc.durationMin)}</span>
                  {svc.price != null && <span className="flex items-center gap-1"><DollarSign size={11} /> ${svc.price.toLocaleString('es-AR')}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setModal(svc)} className="p-2 rounded-lg hover:bg-stone-100 transition-colors text-stone-500 hover:text-stone-700">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => handleDelete(svc)} className="p-2 rounded-lg hover:bg-red-50 transition-colors text-stone-400 hover:text-red-500">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl p-4 text-sm text-stone-500" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
        <strong className="text-stone-700">¿Cómo funciona?</strong> Cuando un cliente reserva, primero elige el servicio y después el horario.
        El sistema bloqueará automáticamente los intervalos necesarios según la duración del servicio.
        {services.length === 0 && ' Si no creás servicios, el cliente puede reservar directamente sin elegir uno.'}
      </div>

      {modal && (
        <ServiceModal
          service={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
