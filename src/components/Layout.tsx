import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-srcc-pageBg font-outfit print:h-auto print:overflow-visible print:block">
      {/* Black mask overlay that appears when the sidebar slides out on phone */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm print:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <div className="print:hidden">
        <Sidebar isMobileMenuOpen={isMobileMenuOpen} />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden w-full print:overflow-visible print:block">
        <div className="print:hidden">
          <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-[max(env(safe-area-inset-bottom),1rem)] print:overflow-visible print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
