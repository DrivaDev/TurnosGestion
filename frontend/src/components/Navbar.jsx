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

  function handleLogout() { logout(); navigate('/login'); }

  return (
    <header className="sticky top-0 z-10 shadow-sm border-b" style={{ background: '#9A3412', borderColor: '#7c2d12' }}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <CalendarDays className="text-white" size={22} />
          <div>
            <span className="font-bold text-white text-lg leading-none">
              {user?.businessName || 'Gestor de Turnos'}
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {links.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? 'text-white bg-white/20'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors ml-1"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
