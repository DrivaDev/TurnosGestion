import { NavLink, useNavigate } from 'react-router-dom';
import { CalendarDays, LayoutDashboard, Clock, Settings, LogOut, LayoutGrid, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard',    label: 'Inicio',    Icon: LayoutDashboard },
  { to: '/appointments', label: 'Turnos',    Icon: CalendarDays },
  { to: '/services',     label: 'Servicios', Icon: LayoutGrid },
  { to: '/staff',        label: 'Equipo',    Icon: Users },
  { to: '/schedule',     label: 'Horarios',  Icon: Clock },
  { to: '/settings',     label: 'Ajustes',   Icon: Settings },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visibleLinks = links.filter(l => l.to !== '/staff' || user?.plan === 'pro');

  function handleLogout() { logout(); navigate('/login'); }

  return (
    <>
      {/* ── Top header ── */}
      <header className="sticky top-0 z-30 shadow-sm border-b" style={{ background: '#9A3412', borderColor: '#7c2d12' }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <CalendarDays className="text-white" size={20} />
            <span className="font-bold text-white text-base leading-none">
              {user?.businessName || 'Turnly'}
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-0.5">
            {visibleLinks.map(({ to, label, Icon }) => (
              <NavLink
                key={to} to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive ? 'text-white bg-white/20' : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <Icon size={15} />
                <span>{label}</span>
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors ml-1"
            >
              <LogOut size={15} />
              <span>Salir</span>
            </button>
          </nav>

          {/* Mobile: logout button in top header */}
          <button
            onClick={handleLogout}
            className="sm:hidden flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut size={15} />
            Salir
          </button>
        </div>
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 flex border-t safe-area-pb" style={{ background: '#9A3412', borderColor: '#7c2d12' }}>
        {visibleLinks.map(({ to, label, Icon }) => (
          <NavLink
            key={to} to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
                isActive ? 'text-white' : 'text-white/45 hover:text-white/80'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={isActive ? 20 : 18} />
                <span className="text-[10px] font-semibold leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
