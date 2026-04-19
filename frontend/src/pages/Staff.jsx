import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Loader2, Users } from 'lucide-react';
import { api } from '../api';

function Avatar({ name, photo, size = 10 }) {
  if (photo) return <img src={photo} alt={name} className={`w-${size} h-${size} rounded-full object-cover shrink-0`} />;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  return (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center shrink-0 font-bold text-white text-sm`}
      style={{ background: 'linear-gradient(135deg,#EA580C,#9A3412)' }}>
      {initials}
    </div>
  );
}

function StaffModal({ member, services, onClose, onSave }) {
  const [form, setForm] = useState({
    name:       member?.name       ?? '',
    photo:      member?.photo      ?? '',
    serviceIds: member?.serviceIds ?? [],
    active:     member?.active     ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  function toggleService(id) {
    setForm(f => ({
      ...f,
      serviceIds: f.serviceIds.includes(id)
        ? f.serviceIds.filter(s => s !== id)
        : [...f.serviceIds, id],
    }));
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('El nombre es requerido'); return; }
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border" style={{ borderColor: '#FED7AA' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg" style={{ color: '#9A3412' }}>
            {member ? 'Editar profesional' : 'Nuevo profesional'}
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X size={20} /></button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar name={form.name || '?'} photo={form.photo} size={14} />
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1.5 text-stone-700">Nombre *</label>
              <input className="input" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: María García" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-stone-700">Foto (URL)</label>
            <input className="input" value={form.photo}
              onChange={e => setForm(f => ({ ...f, photo: e.target.value }))}
              placeholder="https://..." />
            <p className="text-xs text-stone-400 mt-1">URL de imagen. Si no ponés ninguna, se muestran las iniciales.</p>
          </div>

          {services.length > 0 && (
            <div>
              <label className="block text-sm font-semibold mb-2 text-stone-700">Servicios que realiza</label>
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {services.map(svc => (
                  <label key={svc.id} className="flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors"
                    style={form.serviceIds.includes(svc.id)
                      ? { borderColor: '#EA580C', background: '#FFF7ED' }
                      : { borderColor: '#e7e5e4', background: '#fff' }}>
                    <input type="checkbox" checked={form.serviceIds.includes(svc.id)}
                      onChange={() => toggleService(svc.id)} className="accent-orange-500" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-800">{svc.name}</p>
                      {svc.description && <p className="text-xs text-stone-400 truncate">{svc.description}</p>}
                    </div>
                  </label>
                ))}
              </div>
              {services.length > 0 && form.serviceIds.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Sin servicios asignados: este profesional no aparecerá al reservar.</p>
              )}
            </div>
          )}

          {member && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-stone-700">Profesional activo</label>
              <button type="button" onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                className={`w-11 h-6 rounded-full transition-colors relative ${form.active ? 'bg-orange-500' : 'bg-stone-300'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow ${form.active ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors"
            style={{ background: '#EA580C' }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Staff() {
  const [staff, setStaff]     = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [toast, setToast]     = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  async function load() {
    const [s, svcs] = await Promise.all([api.getStaff(), api.get('/services')]);
    setStaff(s);
    setServices(svcs);
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  async function handleSave(form) {
    if (modal?.id) {
      await api.updateStaff(modal.id, form);
      showToast('Profesional actualizado');
    } else {
      await api.createStaff(form);
      showToast('Profesional creado');
    }
    await load();
  }

  async function handleDelete(m) {
    if (!confirm(`¿Eliminar a "${m.name}"?`)) return;
    await api.deleteStaff(m.id);
    showToast('Profesional eliminado');
    await load();
  }

  function serviceNames(ids) {
    return ids.map(id => services.find(s => s.id === id)?.name).filter(Boolean).join(', ');
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
          <h1 className="text-2xl font-bold text-gray-900">Equipo</h1>
          <p className="text-stone-500 text-sm mt-0.5">Cada profesional tiene sus propios turnos y servicios asignados.</p>
        </div>
        <button onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white"
          style={{ background: '#EA580C' }}>
          <Plus size={16} /> Nuevo profesional
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-orange-500" /></div>
      ) : staff.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-2xl border-stone-200">
          <Users size={40} className="mx-auto mb-3 text-stone-300" />
          <h3 className="font-semibold text-stone-500 mb-1">Sin profesionales aún</h3>
          <p className="text-sm text-stone-400 mb-4">Al agregar profesionales, los clientes podrán elegir con quién reservar.</p>
          <button onClick={() => setModal('new')} className="text-sm font-semibold hover:underline" style={{ color: '#EA580C' }}>
            + Agregar primer profesional
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map(m => (
            <div key={m.id} className={`rounded-2xl border p-4 flex items-center gap-4 transition-opacity ${m.active ? '' : 'opacity-50'}`}
              style={{ borderColor: '#FED7AA', background: '#FFFBF7' }}>
              <Avatar name={m.name} photo={m.photo} size={12} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-stone-800">{m.name}</span>
                  {!m.active && <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-400">inactivo</span>}
                </div>
                {m.serviceIds?.length > 0
                  ? <p className="text-xs text-stone-500 mt-0.5 truncate">{serviceNames(m.serviceIds)}</p>
                  : <p className="text-xs text-amber-500 mt-0.5">Sin servicios asignados</p>
                }
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setModal(m)} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-700">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => handleDelete(m)} className="p-2 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl p-4 text-sm text-stone-500" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
        <strong className="text-stone-700">¿Cómo funciona?</strong> Al reservar, el cliente elige el servicio y luego el profesional disponible. Cada profesional tiene su propia agenda independiente.
      </div>

      {modal && (
        <StaffModal
          member={modal === 'new' ? null : modal}
          services={services.filter(s => s.active)}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
