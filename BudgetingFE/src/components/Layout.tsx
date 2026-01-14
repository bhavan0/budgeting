import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChatWidget } from './ChatWidget';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/transactions', label: 'Transactions', icon: '💸' },
  { path: '/categories', label: 'Categories', icon: '🏷️' },
  { path: '/stats', label: 'Stats', icon: '📈' },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  if (isAuthPage) return <Outlet />;

  return (
    <div className="min-h-screen text-slate-100 font-sans selection:bg-indigo-500/30">
      
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl" />
      </div>

      {/* Desktop Header */}
      <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <span className="text-lg">💰</span>
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              BudgetApp
            </span>
          </NavLink>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-900/50 rounded-full border border-white/5 backdrop-blur-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Profile */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-white/5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                {user?.email?.[0].toUpperCase()}
              </div>
              <span className="text-sm text-slate-300 max-w-[100px] truncate">{user?.email?.split('@')[0]}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-32 md:pb-12 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 z-50">
        <div className="glass-card rounded-2xl p-2 flex justify-around items-center bg-slate-900/90 shadow-2xl shadow-black/50 ring-1 ring-white/10">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 w-16 relative ${
                  isActive
                    ? 'text-indigo-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-b-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  )}
                  <span className={`text-2xl transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
                    {item.icon}
                  </span>
                  <span className={`text-[10px] font-medium transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 scale-0 hidden'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* AI Chat Widget */}
      {!isAuthPage && <ChatWidget />}
    </div>
  );
}
