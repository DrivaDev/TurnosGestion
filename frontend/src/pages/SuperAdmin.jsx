import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Loader2, CheckCircle2, XCircle, ExternalLink,
  Edit2, Save, X, StickyNote, Trash2, Clock, AlertTriangle, Crown, Star,
} from 'lucide-react';

function adminReq(method, path, body) {
  const token = localStorage.getItem('admin_token');
  return fetch(`/api/admin${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }).then(async r => {
    if (r.status === 401) { localStorage.removeItem('admin_token'); window.location.href = '/admin/login'; }
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    return d;
  });
}

function NotesModal({ tenant, onClose, onSave }) {
  const [plan, setPlan]   = useState(tenant.plan || 'basic');
  const [notes, setNotes] = useState(tenant.notes || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try { await onSave(tenant.id, { plan, notes }); onClose(); }
    catch (err) { alert(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 p-6 space-y-4" style={{ background: '#27211e' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white">{tenant.name}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18} /></button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Plan</label>
          <div className="flex gap-2">
            {['basic','pro'].map(p => (
              <button key={p} type="button" onClick={() => setPlan(p)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  plan === p ? 'border-orange-500 text-orange-400 bg-orange-900/20' : 'border-white/20 text-white/40 hover:text-white'
                }`}>
                {p === 'pro' ? '⚡ Pro' : '★ Basic'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Notas internas</label>
          <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Contacto, acuerdos, pendientes..."
            className="w-full rounded-xl border border-white/20 bg-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:border-orange-500 resize-none" />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/50 text-sm font-semibold">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white"
            style={{ background: '#EA580C' }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

const FILTER_OPTS = [
  { value: 'all',     label: 'Todos' },
  { value: 'paid',    label: 'Pagados' },
  { value: 'unpaid',  label: 'Sin pago' },
  { value: 'basic',   label: 'Plan Basic' },
  { value: 'pro',     label: 'Plan Pro' },
  { value: 'pending', label: 'Sin aprobar' },
];

export default function SuperAdmin() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [toast, setToast]     = useState(null);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');
  const [toggling, setToggling] = useState(null);
  const navigate = useNavigate();

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  async function load() {
    const data = await adminReq('GET', '/tenants');
    setTenants(data);
  }

  useEffect(() => {
    if (!localStorage.getItem('admin_token')) { navigate('/admin/login'); return; }
    load().finally(() => setLoading(false));
  }, []);

  async function handleSave(id, form) {
    await adminReq('PUT', `/tenants/${id}`, form);
    await load();
    showToast('Cambios guardados');
  }

  async function togglePaid(t) {
    setToggling(t.id);
    try {
      if (t.isPaid) {
        // Remove payment
        await adminReq('PUT', `/tenants/${t.id}`, { paidUntil: '' });
        showToast(`${t.name} marcado como no pago`);
      } else {
        // Mark paid this month
        await adminReq('PUT', `/tenants/${t.id}`, { markPaidThisMonth: true, approved: true });
        showToast(`${t.name} marcado como pago ✓`);
      }
      await load();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setToggling(null); }
  }

  async function handleDelete(t) {
    if (!window.confirm(`¿Eliminar "${t.name}" y todos sus datos?`)) return;
    try {
      await adminReq('DELETE', `/tenants/${t.id}`);
      await load();
      showToast(`"${t.name}" eliminado`);
    } catch (err) { showToast(err.message, 'error'); }
  }

  function logout() { localStorage.removeItem('admin_token'); navigate('/admin/login'); }

  const today = new Date();
  const dayOfMonth = today.getDate();
  const paid    = tenants.filter(t => t.isPaid).length;
  const unpaid  = tenants.length - paid;
  const pending = tenants.filter(t => !t.approved).length;
  const totalMonth = tenants.reduce((s, t) => s + t.stats.thisMonth, 0);

  const filtered = tenants.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.adminEmail?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' ? true
      : filter === 'paid'    ? t.isPaid
      : filter === 'unpaid'  ? !t.isPaid
      : filter === 'basic'   ? t.plan === 'basic'
      : filter === 'pro'     ? t.plan === 'pro'
      : filter === 'pending' ? !t.approved
      : true;
    return matchSearch && matchFilter;
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1C1917' }}>
      <Loader2 size={32} className="animate-spin text-white" />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#1C1917' }}>
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck size={20} style={{ color: '#EA580C' }} />
          <span className="font-bold text-white">Panel Driva Dev</span>
        </div>
        <button onClick={logout} className="text-sm text-white/50 hover:text-white">Salir</button>
      </header>

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* Alerts */}
        {pending > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'rgba(234,88,12,0.12)', border: '1px solid rgba(234,88,12,0.3)', color: '#F97316' }}>
            <Clock size={14} /> {pending} negocio{pending !== 1 ? 's' : ''} pendiente{pending !== 1 ? 's' : ''} de aprobación (se aprueba automáticamente al marcar pago).
          </div>
        )}
        {unpaid > 0 && dayOfMonth >= 1 && dayOfMonth < 10 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            <AlertTriangle size={14} /> {unpaid} sin pago · Se desactivan automáticamente el día 10.
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total', value: tenants.length, color: '#EA580C' },
            { label: 'Pagados', value: paid, color: '#22c55e' },
            { label: 'Sin pago', value: unpaid, color: '#ef4444' },
            { label: 'Turnos/mes', value: totalMonth, color: '#60a5fa' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-white/10 p-3 text-center" style={{ background: '#27211e' }}>
              <p className="text-xs text-white/40 mb-0.5">{label}</p>
              <p className="text-xl font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <input
            className="flex-1 min-w-40 rounded-xl border border-white/20 bg-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:border-orange-500 placeholder-white/30"
            placeholder="Buscar por nombre o email..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
          <select
            className="rounded-xl border border-white/20 bg-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
            value={filter} onChange={e => setFilter(e.target.value)}>
            {FILTER_OPTS.map(o => <option key={o.value} value={o.value} style={{ background: '#1C1917' }}>{o.label}</option>)}
          </select>
        </div>

        {/* List */}
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: '#27211e' }}>
          {filtered.length === 0 ? (
            <p className="text-white/40 text-center py-12 text-sm">No hay negocios que coincidan.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map(t => (
                <div key={t.id} className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5 ${!t.active ? 'opacity-50' : ''}`}>

                  {/* Pay toggle */}
                  <button onClick={() => togglePaid(t)} disabled={toggling === t.id}
                    title={t.isPaid ? 'Quitar pago' : 'Marcar pago del mes'}
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all border ${
                      t.isPaid ? 'bg-green-900/40 border-green-700/60 text-green-400 hover:bg-red-900/40 hover:border-red-700/60 hover:text-red-400'
                               : 'bg-red-900/30 border-red-800/60 text-red-400 hover:bg-green-900/40 hover:border-green-700/60 hover:text-green-400'
                    }`}>
                    {toggling === t.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : t.isPaid ? <CheckCircle2 size={16} /> : <XCircle size={16} />
                    }
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-white text-sm">{t.name}</span>
                      {t.plan === 'pro'
                        ? <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold bg-purple-900/40 text-purple-300 border border-purple-700/40"><Crown size={9} /> Pro</span>
                        : <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-blue-900/40 text-blue-300 border border-blue-700/40"><Star size={9} /> Basic</span>
                      }
                      {!t.approved && <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-900/40 text-orange-400 border border-orange-700/40">pendiente</span>}
                      {!t.active && <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-900/40 text-red-400">inactivo</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {t.adminEmail && <span className="text-xs text-white/35">{t.adminEmail}</span>}
                      <span className="text-xs text-white/25 font-mono">/book/{t.slug}</span>
                    </div>
                    {t.notes && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <StickyNote size={10} className="text-white/25 shrink-0" />
                        <span className="text-xs text-white/30 truncate">{t.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0 text-right">
                    <span className="text-xs text-white/50"><span className="font-semibold text-white/70">{t.stats.thisMonth}</span> este mes</span>
                    <span className="text-xs text-white/30">{t.stats.total} total</span>
                    {t.paidUntil && (
                      <span className="text-xs text-white/25">hasta {new Date(t.paidUntil).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={`/book/${t.slug}`} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg border border-white/20 text-white/40 hover:text-white transition-colors">
                      <ExternalLink size={13} />
                    </a>
                    <button onClick={() => setEditing(t)}
                      className="p-1.5 rounded-lg transition-colors text-white/40 hover:text-orange-400">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => handleDelete(t)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <NotesModal tenant={editing} onClose={() => setEditing(null)} onSave={handleSave} />
      )}
    </div>
  );
}
