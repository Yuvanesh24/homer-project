import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg"
      >
        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        lg:flex
        ${mobileMenuOpen ? 'flex' : 'hidden'}
        fixed lg:relative z-40 h-full
      `}>
        <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto lg:p-0 p-4 pt-16 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
