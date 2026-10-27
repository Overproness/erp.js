import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Features', path: '/features' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

export default function WebsiteNavbar() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 h-16">
      <div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <img src="/logo-bg-remove.webp" alt="ERP.js Logo" width={32} height={32} className="h-8 w-8 object-contain" />
            <span className="text-2xl font-heading font-extrabold tracking-tighter text-slate-900">
              ERP.js
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`font-sans text-[15px] font-medium tracking-tight no-underline transition-colors ${
                    isActive
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-slate-600 hover:text-blue-500'
                  }`}
                  style={{ lineHeight: '4rem' }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-slate-600 hover:text-blue-500 transition-colors font-sans text-[15px] font-medium no-underline hidden sm:inline"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="bg-gradient-to-br from-[#0058c3] to-[#0070f3] text-white px-5 py-2 rounded-lg text-[15px] font-semibold hover:opacity-90 transition-all active:scale-95 shadow-sm no-underline font-sans"
          >
            Get Started
          </Link>
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined text-slate-700">
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>
      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 px-6 py-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`block py-2.5 px-3 rounded-lg text-[15px] font-medium no-underline transition-colors ${
                  isActive ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            to="/login"
            onClick={() => setMobileOpen(false)}
            className="block py-2.5 px-3 rounded-lg text-[15px] font-medium text-slate-600 hover:bg-slate-50 no-underline sm:hidden"
          >
            Sign In
          </Link>
        </div>
      )}
    </nav>
  );
}
