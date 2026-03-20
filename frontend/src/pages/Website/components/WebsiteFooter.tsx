import { Link } from 'react-router-dom';

export default function WebsiteFooter() {
  return (
    <footer className="bg-white border-t border-slate-100 font-inter">
      <div className="max-w-7xl mx-auto py-12 px-6 flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="max-w-xs">
          <span className="font-bold text-slate-900 text-2xl tracking-tighter mb-4 block">
            ERP.js
          </span>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            The operating system for the modern enterprise. Built with precision, engineered for
            scale.
          </p>
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-slate-400 hover:text-[#0058c3] transition-colors cursor-pointer">
              public
            </span>
            <span className="material-symbols-outlined text-slate-400 hover:text-[#0058c3] transition-colors cursor-pointer">
              alternate_email
            </span>
            <span className="material-symbols-outlined text-slate-400 hover:text-[#0058c3] transition-colors cursor-pointer">
              terminal
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 md:gap-24">
          <div className="flex flex-col gap-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Platform
            </p>
            <Link
              to="/features"
              className="text-slate-500 hover:text-blue-600 transition-colors text-sm no-underline"
            >
              Features
            </Link>
            <Link
              to="/pricing"
              className="text-slate-500 hover:text-blue-600 transition-colors text-sm no-underline"
            >
              Pricing
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Company
            </p>
            <Link
              to="/about"
              className="text-slate-500 hover:text-blue-600 transition-colors text-sm no-underline"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-slate-500 hover:text-blue-600 transition-colors text-sm no-underline"
            >
              Contact
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Legal</p>
            <Link
              to="/privacy"
              className="text-slate-500 hover:text-blue-600 transition-colors text-sm no-underline"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-slate-500 hover:text-blue-600 transition-colors text-sm no-underline"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-8 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-slate-500 text-xs">&copy; {new Date().getFullYear()} ERP.js Inc.</p>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            All systems operational
          </span>
        </div>
      </div>
    </footer>
  );
}
