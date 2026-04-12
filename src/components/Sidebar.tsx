import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { CalendarX2, LogOut, LayoutDashboard } from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar({ isMobileMenuOpen }: { isMobileMenuOpen?: boolean }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  return (
    <aside className={clsx(
      "w-64 bg-srcc-portalNavy z-50 fixed inset-y-0 left-0 transform transition-transform duration-300 md:relative md:translate-x-0 flex flex-col text-white shadow-xl print:hidden",
      isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
    )}>
      <div className="h-16 flex items-center px-6 border-b border-white/10 bg-srcc-deepNavy pt-[max(env(safe-area-inset-top),0rem)]">
        <h1 className="text-xl font-serif font-bold tracking-wider">SRCC ADMIN</h1>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            clsx(
              'flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors',
              isActive
                ? 'bg-white/10 text-white'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
            )
          }
        >
          <CalendarX2 className="mr-3 h-5 w-5" />
          Mark Absences
        </NavLink>

      </nav>

      <div className="p-4 border-t border-white/10 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-300 rounded-md hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
