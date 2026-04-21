import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar            from './components/Navbar';
import Login             from './pages/Login';
import Register          from './pages/Register';
import BookingPage       from './pages/BookingPage';
import Dashboard         from './pages/Dashboard';
import Appointments      from './pages/Appointments';
import Schedule          from './pages/Schedule';
import Settings          from './pages/Settings';
import Services          from './pages/Services';
import Staff             from './pages/Staff';
import SuperAdminLogin   from './pages/SuperAdminLogin';
import SuperAdmin        from './pages/SuperAdmin';
import Landing           from './pages/Landing';
import CancelPage        from './pages/CancelPage';
import { MessageSquare } from 'lucide-react';

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {!user.approved && (
        <div className="px-4 py-3 text-sm font-medium flex items-center gap-3" style={{ background: '#FFF7ED', borderBottom: '1px solid #FED7AA', color: '#9A3412' }}>
          <MessageSquare size={16} className="shrink-0" style={{ color: '#EA580C' }} />
          <span>
            Tu sistema aún no está activo. Para activarlo y que tus clientes puedan reservar,{' '}
            <strong>realizá el pago</strong> contactándonos al{' '}
            <a href="https://wa.me/5491139139022?text=Hola!%20Quiero%20activar%20mi%20sistema%20de%20turnos" target="_blank" rel="noopener noreferrer" className="underline font-bold" style={{ color: '#EA580C' }}>
              +54 11 3913-9022
            </a>
            {' '}por WhatsApp. Mientras tanto, podés explorar y configurar todo el sistema.
          </span>
        </div>
      )}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 pb-24 sm:pb-6">
        <Routes>
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/services"     element={<Services />} />
          <Route path="/staff"        element={<Staff />} />
          <Route path="/schedule"     element={<Schedule />} />
          <Route path="/settings"     element={<Settings />} />
          <Route path="*"             element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      <footer className="border-t border-stone-200 py-4 text-center text-xs text-stone-400">
        Desarrollado por{' '}
        <a href="https://drivadev.com" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: '#EA580C' }}>
          Driva Dev
        </a>
        {' '}· Soluciones digitales a medida
      </footer>
    </div>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"             element={<Landing />} />
          <Route path="/login"        element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register"     element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/book/:slug"   element={<BookingPage />} />
          <Route path="/cancel/:token" element={<CancelPage />} />
          <Route path="/admin/login"  element={<SuperAdminLogin />} />
          <Route path="/admin"        element={<SuperAdmin />} />
          <Route path="/*"            element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
