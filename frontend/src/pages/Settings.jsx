import { useEffect, useState } from 'react';
import { Save, Send, Loader2, Eye, EyeOff, Info, Link, Copy, Check, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const REMINDER_OPTS = [
  { value: '30',   label: '30 minutos antes' },
  { value: '60',   label: '1 hora antes' },
  { value: '120',  label: '2 horas antes' },
  { value: '360',  label: '6 horas antes' },
  { value: '720',  label: '12 horas antes' },
  { value: '1440', label: '24 horas antes' },
  { value: '2880', label: '48 horas antes' },
];

export default function Settings() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const bookingURL = user?.slug ? `${window.location.origin}/book/${user.slug}` : '';

  function copyURL() {
    navigator.clipboard.writeText(bookingURL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const [form, setForm] = useState({
    business_name: '',
    business_description: '',
    reminder_minutes: '60',
    confirmation_message: '',
    reminder_message: '',
    twilio_account_sid: '',
    twilio_auth_token: '',
    twilio_whatsapp_from: '',
  });
  const [showToken, setShowToken] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    api.getSettings().then(s => {
      setForm(f => ({ ...f, ...s }));
    });
  }, []);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings(form);
      showToast('Configuración guardada');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!testPhone) { showToast('Ingresá un número de teléfono', 'error'); return; }
    setTesting(true);
    try {
      const r = await api.testWhatsapp(testPhone);
      if (r.ok) showToast('Mensaje de prueba enviado ✅');
      else if (r.reason === 'twilio_not_configured')
        showToast('Twilio no está configurado. Guardá las credenciales primero.', 'error');
      else showToast(`Error: ${r.reason}`, 'error');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <a
        href="https://wa.me/5491139139022"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:opacity-90"
        style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534' }}
      >
        <MessageCircle size={18} style={{ color: '#16a34a' }} className="shrink-0" />
        <span>
          ¿Problemas o consultas? Contactanos por WhatsApp al{' '}
          <strong>+54 11 3913-9022</strong> y te ayudamos al instante.
        </span>
      </a>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ajustes</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Booking URL */}
        {bookingURL && (
          <div className="card space-y-3" style={{ borderColor: '#FED7AA', background: '#FFF7ED' }}>
            <h2 className="font-semibold flex items-center gap-2" style={{ color: '#9A3412' }}>
              <Link size={16} /> Página de reservas para tus clientes
            </h2>
            <p className="text-sm text-stone-500">Compartí este enlace con tus clientes para que puedan reservar turnos online.</p>
            <div className="flex gap-2">
              <input className="input flex-1 font-mono text-xs bg-white" value={bookingURL} readOnly />
              <button type="button" className="btn-secondary shrink-0" onClick={copyURL}>
                {copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
              <a href={bookingURL} target="_blank" rel="noopener noreferrer" className="btn-secondary shrink-0 text-xs">
                Ver página
              </a>
            </div>
          </div>
        )}

        {/* General */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">General</h2>
          <div>
            <label className="label">Nombre del negocio</label>
            <input className="input" value={form.business_name}
              onChange={e => set('business_name', e.target.value)}
              placeholder="Mi Peluquería" />
          </div>
          <div>
            <label className="label">Descripción (aparece en la página de reservas)</label>
            <textarea className="input" rows={2} value={form.business_description}
              onChange={e => set('business_description', e.target.value)}
              placeholder="Ej: Peluquería para hombres en el centro. Cortes modernos y clásicos." />
          </div>
        </div>

        {/* WhatsApp / Twilio */}
        <div className="card space-y-4">
          <div className="flex items-start justify-between">
            <h2 className="font-semibold text-gray-900">WhatsApp (Twilio)</h2>
            <a
              href="https://console.twilio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              <Info size={12} /> Obtener credenciales
            </a>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-800 space-y-1">
            <p className="font-medium">Pasos para configurar WhatsApp:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>Creá una cuenta en twilio.com (tiene trial gratuito)</li>
              <li>Activá el <strong>WhatsApp Sandbox</strong> en Messaging → Try it out</li>
              <li>Copiá el Account SID y Auth Token de tu dashboard</li>
              <li>El número del sandbox es: <code>whatsapp:+14155238886</code></li>
              <li>Tus clientes deben unirse al sandbox enviando el código al número</li>
            </ol>
          </div>

          <div>
            <label className="label">Account SID</label>
            <input className="input font-mono text-sm" value={form.twilio_account_sid}
              onChange={e => set('twilio_account_sid', e.target.value)}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
          </div>
          <div>
            <label className="label">Auth Token</label>
            <div className="relative">
              <input
                className="input font-mono text-sm pr-10"
                type={showToken ? 'text' : 'password'}
                value={form.twilio_auth_token}
                onChange={e => set('twilio_auth_token', e.target.value)}
                placeholder="••••••••••••••••••••••••••••••••"
              />
              <button type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowToken(s => !s)}>
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Número de WhatsApp (From)</label>
            <input className="input font-mono text-sm" value={form.twilio_whatsapp_from}
              onChange={e => set('twilio_whatsapp_from', e.target.value)}
              placeholder="whatsapp:+14155238886" />
            <p className="text-xs text-gray-400 mt-1">Sandbox: whatsapp:+14155238886</p>
          </div>

          {/* Test */}
          <div className="pt-2 border-t space-y-2">
            <label className="label">Probar envío de WhatsApp</label>
            <div className="flex gap-2">
              <input className="input" value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                placeholder="+5491122334455" />
              <button type="button" className="btn-green shrink-0" onClick={handleTest} disabled={testing}>
                {testing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Probar
              </button>
            </div>
          </div>
        </div>

        {/* Reminders */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Recordatorios</h2>
          <div>
            <label className="label">Enviar recordatorio</label>
            <select className="input" value={form.reminder_minutes}
              onChange={e => set('reminder_minutes', e.target.value)}>
              {REMINDER_OPTS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              El sistema revisa y envía recordatorios automáticamente cada minuto.
            </p>
          </div>
        </div>

        {/* Message templates */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Mensajes de WhatsApp</h2>
          <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
            <p className="font-medium mb-1">Variables disponibles:</p>
            <code className="space-x-2">
              <span className="bg-white px-1 py-0.5 rounded border">{'{nombre}'}</span>
              <span className="bg-white px-1 py-0.5 rounded border">{'{fecha}'}</span>
              <span className="bg-white px-1 py-0.5 rounded border">{'{hora}'}</span>
            </code>
          </div>

          <div>
            <label className="label">Mensaje de confirmación</label>
            <textarea className="input" rows={3} value={form.confirmation_message}
              onChange={e => set('confirmation_message', e.target.value)} />
          </div>
          <div>
            <label className="label">Mensaje de recordatorio</label>
            <textarea className="input" rows={3} value={form.reminder_message}
              onChange={e => set('reminder_message', e.target.value)} />
          </div>
        </div>

        <button type="submit" className="btn-primary w-full justify-center py-3" disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Guardar configuración
        </button>
      </form>
    </div>
  );
}
