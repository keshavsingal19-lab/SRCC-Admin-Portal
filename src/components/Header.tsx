import React from 'react';
import { Bell, User, Menu } from 'lucide-react';

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-8 border-b border-gray-200 print:hidden pt-[max(env(safe-area-inset-top),0rem)]">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="mr-4 md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h2 className="text-xl font-semibold text-srcc-portalNavy font-outfit">Absence Management</h2>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="text-gray-400 hover:text-srcc-portalNavy transition-colors">
          <Bell className="h-5 w-5" />
        </button>
        <div className="h-8 w-8 rounded-full bg-srcc-portalNavy flex items-center justify-center text-white">
          <User className="h-5 w-5" />
        </div>
        <span className="hidden md:block text-sm font-medium text-gray-700">Administrator</span>
      </div>
    </header>
  );
}
