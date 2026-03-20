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

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 flex justify-between items-center px-6 h-14 ">
      <div className="flex items-center gap-8">
        <Link
          to="/"
          className="text-xl font-bold tracking-tighter text-slate-900 font-inter no-underline"
        >
          Quickmation
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`font-inter text-sm font-medium tracking-tight no-underline transition-colors ${
                  isActive
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-blue-500'
                }`}
                style={{ lineHeight: '3.5rem' }}
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
          className="text-slate-600 hover:text-blue-500 transition-colors font-inter text-sm font-medium no-underline"
        >
          Sign In
        </Link>
        <Link
          to="/signup"
          className="bg-gradient-to-br from-[#0058c3] to-[#0070f3] text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-all active:scale-95 shadow-sm no-underline font-inter"
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}
