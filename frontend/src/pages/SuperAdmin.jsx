import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ExternalLink, Edit2, Loader2, Save, X, ChevronLeft, Eye } from 'lucide-react';

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

const COLOR_FIELDS = [
  { key: 'primary',   label: 'Color principal',   hint: 'Botones y CTAs' },
  { key: 'secondary', label: 'Color de encabezado', hint: 'Header y títulos' },
  { key: 'accent',    label: 'Color acento',        hint: 'Bordes y badges' },
  { key: 'bg',        label: 'Color de fondo',      hint: 'Fondo general de la página' },
];

export default function SuperAdmin() {
  const [tenants, setTenants]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(null);  // tenant being edited
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);
  const navigate = useNavigate();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!localStorage.getItem('admin_token')) { navigate('/admin/login'); return; }
    adminReq('GET', '/tenants').then(setTenants).finally(() => setLoading(false));
  }, []);

  function openEdit(tenant) {
    setEditing(tenant);
    setForm({
      name:        tenant.name,
      slug:        tenant.slug,
      description: tenant.description,
      theme:       { ...tenant.theme },
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await adminReq('PUT', `/tenants/${editing.id}`, form);
      const updated = await adminReq('GET', '/tenants');
      setTenants(updated);
      setEditing(null);
      showToast('Cambios guardados');
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setSaving(false); }
  }

  function setTheme(key, val) {
    setForm(f => ({ ...f, theme: { ...f.theme, [key]: val } }));
  }

  function logout() { localStorage.removeItem('admin_token'); navigate('/admin/login'); }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1C1917' }}>
      <Loader2 size={32} className="animate-spin text-white" />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#1C1917' }}>
      {/* Topbar */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck size={22} style={{ color: '#EA580C' }} />
          <span className="font-bold text-white text-lg">Panel Driva Dev</span>
          <span className="text-xs text-white/40 ml-2">{tenants.length} negocio{tenants.length !== 1 ? 's' : ''}</span>
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

      <div className="max-w-5xl mx-auto px-4 py-8">
        {!editing ? (
          <>
            <h1 className="text-2xl font-bold text-white mb-6">Negocios registrados</h1>
            {tenants.length === 0 ? (
              <p className="text-white/40 text-center py-20">No hay negocios registrados aún.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tenants.map(t => (
                  <div key={t.id} className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: '#27211e' }}>
                    {/* Mini preview del header */}
                    <div className="h-16 flex items-center px-4 gap-3" style={{ background: t.theme.secondary }}>
                      {t.theme.logo && (
                        <img src={t.theme.logo} alt="logo" className="h-8 w-8 rounded-full object-cover bg-white" />
                      )}
                      <span className="font-bold text-white text-sm truncate">{t.name}</span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex gap-1.5">
                        {[t.theme.primary, t.theme.secondary, t.theme.accent, t.theme.bg].map((c, i) => (
                          <div key={i} className="w-6 h-6 rounded-full border border-white/10" style={{ background: c }} title={c} />
                        ))}
                      </div>
                      <p className="text-xs text-white/40 font-mono">/book/{t.slug}</p>
                      {t.description && (
                        <p className="text-xs text-white/60 line-clamp-2">{t.description}</p>
                      )}
                      <div className="flex gap-2 pt-1">
                        <button
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white transition-colors"
                          style={{ background: '#EA580C' }}
                          onClick={() => openEdit(t)}
                        >
                          <Edit2 size={13} /> Editar página
                        </button>
                        <a
                          href={`/book/${t.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-white/20 text-white/70 hover:text-white transition-colors"
                        >
                          <Eye size={13} />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* ── Editor de negocio ── */
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setEditing(null)} className="flex items-center gap-1 text-white/60 hover:text-white text-sm mb-6 transition-colors">
              <ChevronLeft size={16} /> Volver a negocios
            </button>

            <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: '#27211e' }}>
              {/* Preview header */}
              <div className="h-20 flex items-center px-6 gap-4" style={{ background: form.theme.secondary }}>
                {form.theme.logo && (
                  <img src={form.theme.logo} alt="logo" className="h-12 w-12 rounded-full object-cover bg-white border-2 border-white/30" />
                )}
                <div>
                  <p className="text-white font-bold text-lg leading-tight">{form.name}</p>
                  {form.description && <p className="text-white/70 text-xs">{form.description}</p>}
                </div>
              </div>

              <div className="p-6 space-y-6">
                <h2 className="text-white font-bold text-lg">Editando: {editing.name}</h2>

                {/* Info básica */}
                <div className="space-y-4">
                  <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider">Información</h3>
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-1.5">Nombre del negocio</label>
                    <input
                      className="w-full rounded-xl border border-white/20 bg-white/5 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Nombre del negocio"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-1.5">
                      URL de reservas <span className="text-white/40 font-normal">(slug)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-white/30 text-sm">/book/</span>
                      <input
                        className="flex-1 rounded-xl border border-white/20 bg-white/5 text-white px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-orange-500"
                        value={form.slug}
                        onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                        placeholder="nombre-negocio"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-1.5">Descripción (aparece bajo el nombre)</label>
                    <textarea
                      className="w-full rounded-xl border border-white/20 bg-white/5 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 resize-none"
                      rows={2}
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Ej: Peluquería para hombres en el centro."
                    />
                  </div>
                </div>

                {/* Colores */}
                <div className="space-y-4">
                  <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider">Colores</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {COLOR_FIELDS.map(({ key, label, hint }) => (
                      <div key={key}>
                        <label className="block text-sm font-semibold text-white/80 mb-1">{label}</label>
                        <p className="text-xs text-white/40 mb-2">{hint}</p>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={form.theme[key]}
                            onChange={e => setTheme(key, e.target.value)}
                            className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                          />
                          <input
                            type="text"
                            value={form.theme[key]}
                            onChange={e => setTheme(key, e.target.value)}
                            className="flex-1 rounded-lg border border-white/20 bg-white/5 text-white px-3 py-2 text-sm font-mono focus:outline-none focus:border-orange-500"
                            maxLength={7}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Logo */}
                <div className="space-y-2">
                  <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider">Logo</h3>
                  <label className="block text-sm font-semibold text-white/80 mb-1">URL del logo</label>
                  <input
                    className="w-full rounded-xl border border-white/20 bg-white/5 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                    value={form.theme.logo}
                    onChange={e => setTheme('logo', e.target.value)}
                    placeholder="https://ejemplo.com/logo.png"
                  />
                  <p className="text-xs text-white/30">Subí la imagen a imgur.com o similar y pegá el link directo.</p>
                  {form.theme.logo && (
                    <img src={form.theme.logo} alt="preview" className="w-16 h-16 rounded-full object-cover border-2 border-white/20 mt-2" />
                  )}
                </div>

                {/* Preview button */}
                <a
                  href={`/book/${form.slug || editing.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/20 text-white/70 hover:text-white text-sm font-semibold transition-colors"
                >
                  <ExternalLink size={15} /> Ver página de reservas
                </a>

                {/* Save */}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEditing(null)} className="btn-secondary flex-1 justify-center">
                    <X size={16} /> Cancelar
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors"
                    style={{ background: '#EA580C' }}
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Guardar cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
