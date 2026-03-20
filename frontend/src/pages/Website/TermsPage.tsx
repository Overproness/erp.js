import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import WebsiteLayout from './components/WebsiteLayout';

const sidebarLinks = [
  { id: 'acceptance', label: '1. Acceptance of Terms' },
  { id: 'services', label: '2. Service Description' },
  { id: 'accounts', label: '3. User Accounts' },
  { id: 'licensing', label: '4. Proprietary Rights' },
  { id: 'restrictions', label: '5. Usage Restrictions' },
  { id: 'liability', label: '6. Limitation of Liability' },
  { id: 'termination', label: '7. Termination' },
];

export default function TermsPage() {
  const [activeId, setActiveId] = useState('acceptance');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );

    sidebarLinks.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <WebsiteLayout title="Terms of Service">
      <div className="pt-10 pb-20 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 font-inter">
        {/* Sticky Sidebar */}
        <aside className="hidden md:block md:col-span-3">
          <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto space-y-1">
            <p
              className="text-[0.6875rem] font-semibold uppercase tracking-wider mb-4 px-3"
              style={{ color: '#727786' }}
            >
              On this page
            </p>
            <nav className="flex flex-col gap-1">
              {sidebarLinks.map((link) => {
                const isActive = activeId === link.id;
                return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-all no-underline ${
                    isActive
                      ? 'text-[#0058c3] bg-[#d8e2ff]/30 border-l-2 border-[#0058c3]'
                      : 'hover:bg-[#e7e8e9]'
                  }`}
                  style={!isActive ? { color: '#414754' } : undefined}
                >
                  {link.label}
                </a>
                );
              })}
            </nav>
            <div
              className="mt-8 p-4 rounded-xl border border-[#c1c6d7]/10"
              style={{ background: '#f3f4f5' }}
            >
              <p className="text-xs font-semibold mb-2" style={{ color: '#191c1d' }}>
                Need clarification?
              </p>
              <p className="text-[11px] mb-4 leading-relaxed" style={{ color: '#414754' }}>
                Contact our legal team for specific enterprise licensing queries.
              </p>
              <Link
                to="/contact"
                className="block w-full py-2 bg-[#0058c3] text-white text-xs font-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all text-center no-underline"
              >
                Contact Legal
              </Link>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="col-span-1 md:col-span-9">
          {/* Header */}
          <div className="mb-12 border-b border-[#e7e8e9] pb-8">
            <div className="inline-flex items-center gap-2 px-2 py-1 bg-[#0058c3]/5 text-[#0058c3] rounded text-[10px] font-bold uppercase tracking-widest mb-4">
              <span className="material-symbols-outlined text-[14px]">gavel</span>
              Legal Documentation
            </div>
            <h1
              className="text-4xl md:text-5xl font-black tracking-tighter mb-4"
              style={{ color: '#191c1d' }}
            >
              Terms of Service
            </h1>
            <div
              className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"
              style={{ color: '#414754' }}
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                Last Updated: June 14, 2024
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                Version 2.4.0
              </span>
            </div>
          </div>

          {/* Intro Card */}
          <div
            className="p-6 border border-[#c1c6d7]/20 rounded-xl shadow-sm mb-12"
            style={{ background: '#fff' }}
          >
            <p className="leading-relaxed" style={{ color: '#191c1d' }}>
              Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully before using the{' '}
              <strong className="text-[#0058c3]">ERP.js Automation Suite</strong>. These Terms
              constitute a legally binding agreement between you (&ldquo;Licensee&rdquo;) and
              ERP.js Corp regarding your access to and use of our enterprise automation
              platform.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-16">
            <section id="acceptance" style={{ scrollMarginTop: '6rem' }}>
              <h2
                className="text-xl font-bold tracking-tight mb-4 flex items-center gap-3"
                style={{ color: '#191c1d' }}
              >
                <span className="w-8 h-8 rounded bg-[#0070f3] text-white flex items-center justify-center text-xs">
                  01
                </span>
                Acceptance of Terms
              </h2>
              <div className="space-y-4 leading-relaxed" style={{ color: '#414754' }}>
                <p>
                  By accessing or using any part of the ERP.js ecosystem, you agree to become
                  bound by the terms and conditions of this agreement. If you do not agree to all
                  the terms and conditions of this agreement, then you may not access the Website or
                  use any services.
                </p>
                <p>
                  The platform is intended for professional use by entities and organizations. Users
                  represent and warrant that they have the legal authority to bind their employer or
                  the entity they represent to these Terms.
                </p>
              </div>
            </section>

            <section id="services" style={{ scrollMarginTop: '6rem' }}>
              <h2
                className="text-xl font-bold tracking-tight mb-4 flex items-center gap-3"
                style={{ color: '#191c1d' }}
              >
                <span className="w-8 h-8 rounded bg-[#0070f3] text-white flex items-center justify-center text-xs">
                  02
                </span>
                Service Description
              </h2>
              <div className="space-y-4 leading-relaxed" style={{ color: '#414754' }}>
                <p>
                  ERP.js provides a high-performance, developer-centric suite of enterprise
                  tools including but not limited to:
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 list-none p-0">
                  {[
                    {
                      icon: 'analytics',
                      title: 'Real-time Analytics',
                      desc: 'Stream processing of organizational data.',
                    },
                    {
                      icon: 'shield',
                      title: 'Security Guardrails',
                      desc: 'Automated compliance and audit logging.',
                    },
                    {
                      icon: 'hub',
                      title: 'Module Orchestration',
                      desc: 'Seamless linking of distributed services.',
                    },
                    {
                      icon: 'database',
                      title: 'Data Persistence',
                      desc: 'Redundant distributed storage solutions.',
                    },
                  ].map((item) => (
                    <li
                      key={item.title}
                      className="flex items-start gap-3 p-3 rounded-lg border-l-4 border-[#0058c3]"
                      style={{ background: '#f3f4f5' }}
                    >
                      <span className="material-symbols-outlined text-[#0058c3] text-[20px]">
                        {item.icon}
                      </span>
                      <div>
                        <p className="text-xs font-bold" style={{ color: '#191c1d' }}>
                          {item.title}
                        </p>
                        <p className="text-[11px]">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section id="accounts" style={{ scrollMarginTop: '6rem' }}>
              <h2
                className="text-xl font-bold tracking-tight mb-4 flex items-center gap-3"
                style={{ color: '#191c1d' }}
              >
                <span className="w-8 h-8 rounded bg-[#0070f3] text-white flex items-center justify-center text-xs">
                  03
                </span>
                User Accounts
              </h2>
              <div className="space-y-4 leading-relaxed" style={{ color: '#414754' }}>
                <p>
                  Access to certain features requires account registration. You are responsible for:
                </p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Maintaining the <strong>confidentiality</strong> of your account credentials.
                  </li>
                  <li>
                    Promptly notifying ERP.js of any <strong>unauthorized use</strong> or
                    security breach.
                  </li>
                  <li>
                    Ensuring all user-generated data complies with local and international{' '}
                    <strong>privacy laws</strong>.
                  </li>
                </ol>
                <div className="mt-4 p-4 border border-[#ba1a1a]/20 bg-[#ffdad6]/10 rounded-lg flex gap-4">
                  <span className="material-symbols-outlined text-[#ba1a1a]">warning</span>
                  <p className="text-xs" style={{ color: '#93000a' }}>
                    Failure to maintain account security may result in immediate suspension of the
                    enterprise instance without prior notice.
                  </p>
                </div>
              </div>
            </section>

            <section id="licensing" style={{ scrollMarginTop: '6rem' }}>
              <h2
                className="text-xl font-bold tracking-tight mb-4 flex items-center gap-3"
                style={{ color: '#191c1d' }}
              >
                <span className="w-8 h-8 rounded bg-[#0070f3] text-white flex items-center justify-center text-xs">
                  04
                </span>
                Proprietary Rights
              </h2>
              <div className="space-y-4 leading-relaxed" style={{ color: '#414754' }}>
                <p>
                  The Service and its original content, features, and functionality are and will
                  remain the exclusive property of ERP.js and its licensors. Our intellectual
                  property is protected by copyright, trademark, and other laws.
                </p>
                <p>
                  Your license is <strong>non-exclusive, non-transferable, and revocable</strong>,
                  subject to the active status of your subscription tier.
                </p>
              </div>
            </section>

            <section id="restrictions" style={{ scrollMarginTop: '6rem' }}>
              <h2
                className="text-xl font-bold tracking-tight mb-4 flex items-center gap-3"
                style={{ color: '#191c1d' }}
              >
                <span className="w-8 h-8 rounded bg-[#0070f3] text-white flex items-center justify-center text-xs">
                  05
                </span>
                Usage Restrictions
              </h2>
              <div
                className="p-6 rounded-xl border-t-2 border-[#0058c3]"
                style={{ background: '#e7e8e9' }}
              >
                <p
                  className="text-sm font-bold mb-4 uppercase tracking-widest"
                  style={{ color: '#191c1d' }}
                >
                  The &ldquo;No-Breach&rdquo; Protocol
                </p>
                <ul className="space-y-3 list-none p-0">
                  {[
                    'No reverse engineering of the core engine binaries.',
                    'No automated scraping that exceeds 100 requests per second.',
                    'No sharing of single-user licenses across multiple employees.',
                  ].map((rule) => (
                    <li key={rule} className="flex items-center gap-3 text-sm">
                      <span className="material-symbols-outlined text-[#0058c3] text-sm">
                        check_circle
                      </span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section id="liability" style={{ scrollMarginTop: '6rem' }}>
              <h2
                className="text-xl font-bold tracking-tight mb-4 flex items-center gap-3"
                style={{ color: '#191c1d' }}
              >
                <span className="w-8 h-8 rounded bg-[#0070f3] text-white flex items-center justify-center text-xs">
                  06
                </span>
                Limitation of Liability
              </h2>
              <div
                className="p-6 rounded-xl font-mono text-xs leading-relaxed uppercase"
                style={{ background: '#2e3132', color: '#f0f1f2' }}
              >
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL ERP.JS,
                ITS AFFILIATES, AGENTS, DIRECTORS, OR EMPLOYEES BE LIABLE FOR ANY INDIRECT,
                PUNITIVE, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR EXEMPLARY DAMAGES, INCLUDING WITHOUT
                LIMITATION DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA OR OTHER INTANGIBLE
                LOSSES.
              </div>
            </section>

            <section id="termination" style={{ scrollMarginTop: '6rem' }}>
              <h2
                className="text-xl font-bold tracking-tight mb-4 flex items-center gap-3"
                style={{ color: '#191c1d' }}
              >
                <span className="w-8 h-8 rounded bg-[#0070f3] text-white flex items-center justify-center text-xs">
                  07
                </span>
                Termination
              </h2>
              <div className="space-y-4 leading-relaxed" style={{ color: '#414754' }}>
                <p>
                  We may terminate or suspend your account and bar access to the Service
                  immediately, without prior notice or liability, under our sole discretion, for any
                  reason whatsoever and without limitation, including but not limited to a breach of
                  the Terms.
                </p>
                <p>
                  If you wish to terminate your account, you may simply discontinue using the
                  Service or contact our support team for account deletion.
                </p>
              </div>
            </section>
          </div>

          {/* CTA Bottom */}
          <div className="mt-20 p-8 rounded-2xl bg-gradient-to-br from-[#0058c3] to-[#0070f3] text-white text-center relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-2">Ready to deploy?</h3>
              <p className="text-[#d8e2ff] mb-6 max-w-md mx-auto opacity-90">
                By clicking &ldquo;Agree and Continue&rdquo;, you acknowledge that you have read and
                understood our enterprise terms.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  to="/signup"
                  className="px-8 py-3 bg-white text-[#0058c3] font-bold rounded-lg shadow-xl shadow-black/20 hover:scale-105 transition-transform active:scale-95 no-underline"
                >
                  Agree and Continue
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WebsiteLayout>
  );
}
