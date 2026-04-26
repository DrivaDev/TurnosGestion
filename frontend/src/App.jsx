import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MessageSquare } from 'lucide-react';

const Navbar         = lazy(() => import('./components/Navbar'));
const Login          = lazy(() => import('./pages/Login'));
const Register       = lazy(() => import('./pages/Register'));
const BookingPage    = lazy(() => import('./pages/BookingPage'));
const Dashboard      = lazy(() => import('./pages/Dashboard'));
const Appointments   = lazy(() => import('./pages/Appointments'));
const Schedule       = lazy(() => import('./pages/Schedule'));
const Settings       = lazy(() => import('./pages/Settings'));
const Services       = lazy(() => import('./pages/Services'));
const Staff          = lazy(() => import('./pages/Staff'));
const SuperAdminLogin = lazy(() => import('./pages/SuperAdminLogin'));
const SuperAdmin     = lazy(() => import('./pages/SuperAdmin'));
const Landing        = lazy(() => import('./pages/Landing'));
const CancelPage     = lazy(() => import('./pages/CancelPage'));

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
    </div>
  );
}

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
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
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/"              element={<Landing />} />
            <Route path="/login"         element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register"      element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/book/:slug"    element={<BookingPage />} />
            <Route path="/cancel/:token" element={<CancelPage />} />
            <Route path="/admin/login"   element={<SuperAdminLogin />} />
            <Route path="/admin"         element={<SuperAdmin />} />
            <Route path="/*"             element={<ProtectedLayout />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
