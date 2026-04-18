import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Loader2, CheckCircle2, XCircle, ExternalLink,
  CalendarDays, TrendingUp, Edit2, Save, X, StickyNote, Trash2,
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

function PayBadge({ isPaid, paidUntil }) {
  if (isPaid) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-900/40 text-green-400 border border-green-700/40">
      <CheckCircle2 size={12} /> Pago al día
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-900/40 text-red-400 border border-red-700/40">
      <XCircle size={12} /> {paidUntil ? 'Vencido' : 'Sin pago'}
    </span>
  );
}

function EditModal({ tenant, onClose, onSave }) {
  const [form, setForm] = useState({
    paidUntil: tenant.paidUntil ? tenant.paidUntil.slice(0, 10) : '',
    notes:     tenant.notes || '',
    active:    tenant.active,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try { await onSave(tenant.id, form); onClose(); }
    catch (err) { alert(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 p-6 space-y-5" style={{ background: '#27211e' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white text-lg">{tenant.name}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20} /></button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">Pago hasta</label>
          <input
            type="date"
            value={form.paidUntil}
            onChange={e => setForm(f => ({ ...f, paidUntil: e.target.value }))}
            className="w-full rounded-xl border border-white/20 bg-white/5 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
          />
          <p className="text-xs text-white/30 mt-1">Dejá vacío si no pagó.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">Notas internas</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Acordado mensual, pendiente de..., etc."
            className="w-full rounded-xl border border-white/20 bg-white/5 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-white/70 font-medium">Negocio activo</label>
          <button
            onClick={() => setForm(f => ({ ...f, active: !f.active }))}
            className={`w-11 h-6 rounded-full transition-colors relative ${form.active ? 'bg-orange-600' : 'bg-white/20'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${form.active ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/60 hover:text-white text-sm font-semibold transition-colors">
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

export default function SuperAdmin() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [toast, setToast]     = useState(null);
  const navigate = useNavigate();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

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

  async function handleDelete(tenant) {
    if (!window.confirm(`¿Eliminar "${tenant.name}" y todos sus datos? Esta acción no se puede deshacer.`)) return;
    try {
      await adminReq('DELETE', `/tenants/${tenant.id}`);
      await load();
      showToast(`"${tenant.name}" eliminado`);
    } catch (err) { showToast(err.message, 'error'); }
  }

  function logout() { localStorage.removeItem('admin_token'); navigate('/admin/login'); }

  const paid   = tenants.filter(t => t.isPaid).length;
  const unpaid = tenants.length - paid;
  const totalMonth = tenants.reduce((s, t) => s + t.stats.thisMonth, 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1C1917' }}>
      <Loader2 size={32} className="animate-spin text-white" />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#1C1917' }}>
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck size={22} style={{ color: '#EA580C' }} />
          <span className="font-bold text-white text-lg">Panel Driva Dev</span>
        </div>
        <button onClick={logout} className="text-sm text-white/50 hover:text-white transition-colors">
          Cerrar sesión
        </button>
      </header>

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
        }`}>{toast.msg}</div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Negocios',       value: tenants.length,  color: '#EA580C' },
            { label: 'Al día',         value: paid,            color: '#22c55e' },
            { label: 'Pendiente pago', value: unpaid,          color: '#f87171' },
            { label: 'Turnos este mes',value: totalMonth,      color: '#60a5fa' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-white/10 p-4" style={{ background: '#27211e' }}>
              <p className="text-xs text-white/40 mb-1">{label}</p>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Tenant list */}
        <div className="space-y-3">
          {tenants.length === 0 ? (
            <p className="text-white/40 text-center py-20">No hay negocios registrados aún.</p>
          ) : tenants.map(t => (
            <div key={t.id} className="rounded-2xl border border-white/10 p-5" style={{ background: '#27211e' }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-white text-base">{t.name}</span>
                    {!t.active && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white/40">inactivo</span>
                    )}
                    <PayBadge isPaid={t.isPaid} paidUntil={t.paidUntil} />
                  </div>
                  <p className="text-xs text-white/40 font-mono mb-2">/book/{t.slug}</p>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-xs text-white/50">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={12} /> {t.stats.thisMonth} este mes
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp size={12} /> {t.stats.total} total
                    </span>
                    {t.paidUntil && (
                      <span>hasta {new Date(t.paidUntil).toLocaleDateString('es-AR')}</span>
                    )}
                  </div>

                  {t.notes && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-white/40">
                      <StickyNote size={11} className="mt-0.5 shrink-0" />
                      <span>{t.notes}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/book/${t.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-white/20 text-white/60 hover:text-white transition-colors"
                  >
                    <ExternalLink size={13} /> Ver
                  </a>
                  <button
                    onClick={() => setEditing(t)}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-colors"
                    style={{ background: '#EA580C' }}
                  >
                    <Edit2 size={13} /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-red-800/60 text-red-400 hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editing && (
        <EditModal
          tenant={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
