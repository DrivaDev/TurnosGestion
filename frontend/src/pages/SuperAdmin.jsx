import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Loader2, CheckCircle2, XCircle, ExternalLink,
  CalendarDays, TrendingUp, Edit2, Save, X, StickyNote, Trash2,
  Clock, Users, Mail, Crown, Star, DollarSign, AlertTriangle,
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

function PlanBadge({ plan }) {
  return plan === 'pro'
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-900/40 text-purple-300 border border-purple-700/40"><Crown size={10} /> Pro</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900/40 text-blue-300 border border-blue-700/40"><Star size={10} /> Basic</span>;
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
    paidUntil: tenant.paidUntil ? new Date(tenant.paidUntil).toISOString().slice(0, 10) : '',
    notes:     tenant.notes || '',
    active:    tenant.active,
    approved:  tenant.approved,
    plan:      tenant.plan || 'basic',
  });
  const [saving, setSaving] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  async function handleSave() {
    setSaving(true);
    try { await onSave(tenant.id, form); onClose(); }
    catch (err) { alert(err.message); }
    finally { setSaving(false); }
  }

  async function handleMarkPaid() {
    setMarkingPaid(true);
    try { await onSave(tenant.id, { markPaidThisMonth: true }); onClose(); }
    catch (err) { alert(err.message); }
    finally { setMarkingPaid(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 p-6 space-y-5 my-4" style={{ background: '#27211e' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white text-lg">{tenant.name}</h2>
            {tenant.adminEmail && <p className="text-xs text-white/40 mt-0.5">{tenant.adminEmail}</p>}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20} /></button>
        </div>

        {/* Mark paid quick button */}
        <button onClick={handleMarkPaid} disabled={markingPaid}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-colors"
          style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
          {markingPaid ? <Loader2 size={15} className="animate-spin" /> : <DollarSign size={15} />}
          ✓ Marcar pago del mes actual
        </button>

        {/* Plan */}
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">Plan</label>
          <div className="flex gap-2">
            {['basic', 'pro'].map(p => (
              <button key={p} type="button" onClick={() => setForm(f => ({ ...f, plan: p }))}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors capitalize ${
                  form.plan === p ? 'border-orange-500 text-orange-400 bg-orange-900/20' : 'border-white/20 text-white/50 hover:text-white'
                }`}>
                {p === 'pro' ? '⚡ Pro' : '★ Basic'}
              </button>
            ))}
          </div>
        </div>

        {/* Pago hasta */}
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">Pago hasta (fecha manual)</label>
          <input type="date" value={form.paidUntil}
            onChange={e => setForm(f => ({ ...f, paidUntil: e.target.value }))}
            className="w-full rounded-xl border border-white/20 bg-white/5 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
          <p className="text-xs text-white/30 mt-1">Dejá vacío si no pagó.</p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">Notas internas</label>
          <textarea rows={3} value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Acordado mensual, pendiente de..., etc."
            className="w-full rounded-xl border border-white/20 bg-white/5 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 resize-none" />
        </div>

        {/* Toggles */}
        {[
          { key: 'approved', label: 'Aprobado (puede recibir turnos)' },
          { key: 'active',   label: 'Activo (visible al público)' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <label className="text-sm text-white/70 font-medium flex-1">{label}</label>
            <button onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${form[key] ? 'bg-orange-600' : 'bg-white/20'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${form[key] ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        ))}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/60 hover:text-white text-sm font-semibold transition-colors">
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

function StatPill({ icon: Icon, value, label, color }) {
  return (
    <div className="flex items-center gap-1.5 text-xs" style={{ color }}>
      <Icon size={12} />
      <span className="font-semibold">{value}</span>
      <span className="text-white/30">{label}</span>
    </div>
  );
}

export default function SuperAdmin() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [toast, setToast]     = useState(null);
  const [search, setSearch]   = useState('');
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

  const today = new Date();
  const dayOfMonth = today.getDate();
  const paid    = tenants.filter(t => t.isPaid).length;
  const unpaid  = tenants.length - paid;
  const pending = tenants.filter(t => !t.approved).length;
  const totalMonth = tenants.reduce((s, t) => s + t.stats.thisMonth, 0);
  const proCount = tenants.filter(t => t.plan === 'pro').length;

  const filtered = tenants.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.adminEmail?.toLowerCase().includes(search.toLowerCase())
  );

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

        {/* Alerts */}
        {pending > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium" style={{ background: 'rgba(234,88,12,0.12)', border: '1px solid rgba(234,88,12,0.3)', color: '#F97316' }}>
            <Clock size={16} className="shrink-0" />
            {pending} negocio{pending !== 1 ? 's' : ''} pendiente{pending !== 1 ? 's' : ''} de aprobación.
          </div>
        )}
        {unpaid > 0 && dayOfMonth >= 1 && dayOfMonth < 10 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            <AlertTriangle size={16} className="shrink-0" />
            {unpaid} negocio{unpaid !== 1 ? 's' : ''} sin pago este mes. Tienen hasta el día 10 para pagar o se desactivan automáticamente.
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total negocios', value: tenants.length,   color: '#EA580C' },
            { label: 'Pagos al día',   value: paid,             color: '#22c55e' },
            { label: 'Sin pago',       value: unpaid,           color: '#ef4444' },
            { label: 'Plan Pro',       value: proCount,         color: '#a855f7' },
            { label: 'Turnos este mes',value: totalMonth,       color: '#60a5fa' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-white/10 p-4" style={{ background: '#27211e' }}>
              <p className="text-xs text-white/40 mb-1">{label}</p>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <input
          className="w-full rounded-xl border border-white/20 bg-white/5 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 placeholder-white/30"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* Tenant list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-white/40 text-center py-20">No hay negocios registrados aún.</p>
          ) : filtered.map(t => (
            <div key={t.id} className={`rounded-2xl border p-5 transition-opacity ${t.active ? 'border-white/10' : 'border-red-900/30 opacity-60'}`}
              style={{ background: '#27211e' }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Header */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-base">{t.name}</span>
                    <PlanBadge plan={t.plan} />
                    <PayBadge isPaid={t.isPaid} paidUntil={t.paidUntil} />
                    {!t.approved && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-900/40 text-orange-400 border border-orange-700/40">
                        <Clock size={10} /> Pendiente
                      </span>
                    )}
                    {!t.active && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-900/40 text-red-400">Inactivo</span>
                    )}
                  </div>

                  {/* Admin info */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-white/40 font-mono">/book/{t.slug}</span>
                    {t.adminEmail && (
                      <span className="flex items-center gap-1 text-xs text-white/40">
                        <Mail size={11} /> {t.adminEmail}
                      </span>
                    )}
                    {t.adminName && (
                      <span className="text-xs text-white/40">{t.adminName}</span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <StatPill icon={CalendarDays} value={t.stats.today}     label="hoy"       color="#60a5fa" />
                    <StatPill icon={TrendingUp}   value={t.stats.thisMonth} label="este mes"  color="#34d399" />
                    <StatPill icon={CalendarDays} value={t.stats.total}     label="total"     color="#9ca3af" />
                    {t.stats.staff > 0 && <StatPill icon={Users} value={t.stats.staff} label="profesionales" color="#a78bfa" />}
                    {t.paidUntil && (
                      <span className="text-xs text-white/30">
                        Pago hasta {new Date(t.paidUntil).toLocaleDateString('es-AR')}
                      </span>
                    )}
                    {t.deactivatedAt && !t.active && (
                      <span className="text-xs text-red-400/60">
                        Desactivado {new Date(t.deactivatedAt).toLocaleDateString('es-AR')}
                      </span>
                    )}
                  </div>

                  {/* Registered */}
                  <p className="text-xs text-white/25">
                    Registrado {new Date(t.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>

                  {t.notes && (
                    <div className="flex items-start gap-1.5 text-xs text-white/40">
                      <StickyNote size={11} className="mt-0.5 shrink-0" />
                      <span>{t.notes}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a href={`/book/${t.slug}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-white/20 text-white/60 hover:text-white transition-colors">
                    <ExternalLink size={13} /> Ver
                  </a>
                  <button onClick={() => setEditing(t)}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-colors"
                    style={{ background: '#EA580C' }}>
                    <Edit2 size={13} /> Editar
                  </button>
                  <button onClick={() => handleDelete(t)}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-red-800/60 text-red-400 hover:bg-red-900/30 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editing && (
        <EditModal tenant={editing} onClose={() => setEditing(null)} onSave={handleSave} />
      )}
    </div>
  );
}
