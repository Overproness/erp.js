import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import WebsiteLayout from './components/WebsiteLayout';

const sections = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'data-collection', label: 'Data Collection' },
  { id: 'usage', label: 'Usage Policy' },
  { id: 'security', label: 'Security Measures' },
  { id: 'rights', label: 'User Rights' },
];

export default function PrivacyPage() {
  const [activeId, setActiveId] = useState('introduction');

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

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <WebsiteLayout title="Privacy Policy">
      <div className="pt-10 pb-20 px-6 max-w-7xl mx-auto font-inter">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-6"
                style={{ color: '#414754' }}
              >
                Documentation
              </h3>
              <nav className="flex flex-col gap-1">
                {sections.map((section) => {
                  const isActive = activeId === section.id;
                  return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all no-underline ${
                      isActive
                        ? 'text-[#0058c3] bg-[#0058c3]/5 border-l-2 border-[#0058c3]'
                        : 'hover:text-[#0058c3] hover:bg-[#e7e8e9]'
                    }`}
                    style={!isActive ? { color: '#414754' } : undefined}
                  >
                    {section.label}
                  </a>
                  );
                })}
              </nav>
              <div
                className="mt-12 p-6 rounded-xl border border-[#c1c6d7]/20"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-[#0058c3]">verified_user</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#0058c3]">
                    Compliance
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#414754' }}>
                  ERP.js is fully GDPR and SOC2 compliant, ensuring your enterprise data
                  remains secure.
                </p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 max-w-3xl">
            <div className="mb-12">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#0058c3] mb-3 block">
                Last Updated: October 24, 2024
              </span>
              <h1
                className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight"
                style={{ color: '#191c1d' }}
              >
                Privacy <span className="text-[#0070f3]">Policy</span>
              </h1>
              <p className="text-lg leading-relaxed" style={{ color: '#414754' }}>
                At ERP.js, we prioritize the integrity and confidentiality of your data. This
                policy outlines our commitment to transparency and the measures we take to protect
                your information.
              </p>
            </div>

            <div className="space-y-16">
              {/* Introduction */}
              <section id="introduction" style={{ scrollMarginTop: '100px' }}>
                <h2
                  className="text-2xl font-bold mb-6 flex items-center gap-3"
                  style={{ color: '#191c1d' }}
                >
                  <span className="h-8 w-1 bg-[#0058c3] rounded-full"></span>
                  Introduction
                </h2>
                <div
                  className="p-8 rounded-xl shadow-sm"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(20px)',
                    borderTop: '1px solid rgba(255,255,255,0.4)',
                    borderLeft: '1px solid rgba(255,255,255,0.4)',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    borderRight: '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  <p className="leading-relaxed mb-4" style={{ color: '#414754' }}>
                    This Privacy Policy describes how ERP.js (&ldquo;we&rdquo;,
                    &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, and shares information
                    about you when you use our website, mobile application, and other online
                    products and services (collectively, the &ldquo;Services&rdquo;).
                  </p>
                  <p className="leading-relaxed" style={{ color: '#414754' }}>
                    By accessing or using our Services, you agree to the terms of this Privacy
                    Policy and our Terms of Service. If you do not agree with our policies and
                    practices, your choice is not to use our Services.
                  </p>
                </div>
              </section>

              {/* Data Collection */}
              <section id="data-collection" style={{ scrollMarginTop: '100px' }}>
                <h2
                  className="text-2xl font-bold mb-6 flex items-center gap-3"
                  style={{ color: '#191c1d' }}
                >
                  <span className="h-8 w-1 bg-[#0058c3] rounded-full"></span>
                  Data Collection
                </h2>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div
                      className="p-6 rounded-xl border border-[#c1c6d7]/10"
                      style={{ background: '#fff' }}
                    >
                      <span className="material-symbols-outlined text-[#0058c3] mb-3">person</span>
                      <h4 className="font-bold mb-2" style={{ color: '#191c1d' }}>
                        Personal Information
                      </h4>
                      <p className="text-sm leading-relaxed" style={{ color: '#414754' }}>
                        We collect information you provide directly to us, such as your name, email
                        address, and billing information when you register for an account.
                      </p>
                    </div>
                    <div
                      className="p-6 rounded-xl border border-[#c1c6d7]/10"
                      style={{ background: '#fff' }}
                    >
                      <span className="material-symbols-outlined text-[#0058c3] mb-3">
                        monitoring
                      </span>
                      <h4 className="font-bold mb-2" style={{ color: '#191c1d' }}>
                        Usage Data
                      </h4>
                      <p className="text-sm leading-relaxed" style={{ color: '#414754' }}>
                        We automatically collect certain information when you access our Services,
                        including IP addresses, browser types, and interaction logs.
                      </p>
                    </div>
                  </div>
                  <div className="p-6 rounded-xl" style={{ background: '#f3f4f5' }}>
                    <h4
                      className="font-bold mb-3 flex items-center gap-2"
                      style={{ color: '#191c1d' }}
                    >
                      <span className="material-symbols-outlined text-sm">
                        integration_instructions
                      </span>
                      Third-Party Integrations
                    </h4>
                    <p className="text-sm leading-relaxed" style={{ color: '#414754' }}>
                      If you connect your ERP.js account with third-party services (e.g., cloud
                      providers or authentication services), we may receive information from those
                      services as per their authorization protocols.
                    </p>
                  </div>
                </div>
              </section>

              {/* Usage */}
              <section id="usage" style={{ scrollMarginTop: '100px' }}>
                <h2
                  className="text-2xl font-bold mb-6 flex items-center gap-3"
                  style={{ color: '#191c1d' }}
                >
                  <span className="h-8 w-1 bg-[#0058c3] rounded-full"></span>
                  Usage Policy
                </h2>
                <div
                  className="p-8 rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(20px)',
                    borderTop: '1px solid rgba(255,255,255,0.4)',
                    borderLeft: '1px solid rgba(255,255,255,0.4)',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    borderRight: '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  <ul className="space-y-6 list-none p-0 m-0">
                    {[
                      {
                        title: 'Service Optimization',
                        desc: 'We use collected data to analyze trends, administer the site, and improve the user experience of our platform.',
                      },
                      {
                        title: 'Communication',
                        desc: 'To send you technical notices, updates, security alerts, and support and administrative messages.',
                      },
                      {
                        title: 'Compliance & Legal',
                        desc: 'To respond to legal requests and prevent harm, ensuring our platform remains a safe environment for all stakeholders.',
                      },
                    ].map((item) => (
                      <li key={item.title} className="flex gap-4">
                        <div className="shrink-0 h-6 w-6 rounded-full bg-[#0058c3]/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#0058c3] text-xs">
                            check
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold" style={{ color: '#191c1d' }}>
                            {item.title}
                          </h4>
                          <p className="text-sm" style={{ color: '#414754' }}>
                            {item.desc}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Security */}
              <section id="security" style={{ scrollMarginTop: '100px' }}>
                <h2
                  className="text-2xl font-bold mb-6 flex items-center gap-3"
                  style={{ color: '#191c1d' }}
                >
                  <span className="h-8 w-1 bg-[#0058c3] rounded-full"></span>
                  Security Measures
                </h2>
                <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-8 text-white">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <span className="material-symbols-outlined" style={{ fontSize: '120px' }}>
                      shield_lock
                    </span>
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-400">encrypted</span>
                      Encryption Protocol
                    </h4>
                    <p className="text-blue-100/70 mb-8 leading-relaxed">
                      Your data is encrypted at rest and in transit using industry-standard AES-256
                      and TLS 1.3 protocols. We employ multi-layer protection systems to ensure
                      zero-leak integrity across all data nodes.
                    </p>
                    <div className="grid sm:grid-cols-3 gap-6">
                      {[
                        { val: '99.9%', label: 'Uptime SLA' },
                        { val: 'ISO', label: '27001 Certified' },
                        { val: '24/7', label: 'Active Monitoring' },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="bg-white/5 p-4 rounded-lg border border-white/10"
                        >
                          <span className="block text-blue-400 font-black text-lg mb-1">
                            {stat.val}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest text-blue-200">
                            {stat.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* User Rights */}
              <section id="rights" style={{ scrollMarginTop: '100px' }}>
                <h2
                  className="text-2xl font-bold mb-6 flex items-center gap-3"
                  style={{ color: '#191c1d' }}
                >
                  <span className="h-8 w-1 bg-[#0058c3] rounded-full"></span>
                  User Rights
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    {
                      title: 'Right to Access',
                      desc: 'Request a copy of the personal data we hold about you at any time.',
                    },
                    {
                      title: 'Right to Erasure',
                      desc: 'Request that we delete your personal data under certain conditions.',
                    },
                    {
                      title: 'Right to Rectify',
                      desc: 'Request correction of information you believe is inaccurate.',
                    },
                    {
                      title: 'Right to Object',
                      desc: 'Object to our processing of your personal data for specific purposes.',
                    },
                  ].map((right) => (
                    <div
                      key={right.title}
                      className="p-6 rounded-xl border-l-4 border-[#0058c3] shadow-sm hover:-translate-y-1 transition-all"
                      style={{ background: '#fff' }}
                    >
                      <h4 className="font-bold mb-2" style={{ color: '#191c1d' }}>
                        {right.title}
                      </h4>
                      <p className="text-sm" style={{ color: '#414754' }}>
                        {right.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Contact CTA */}
            <div className="mt-20 p-10 rounded-2xl bg-[#0058c3] relative overflow-hidden text-white shadow-2xl shadow-blue-500/20">
              <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-4 tracking-tight">
                  Have questions about your data?
                </h3>
                <p className="text-blue-100 mb-8 max-w-lg">
                  Our privacy team is available to help you understand how your information is
                  handled within our ecosystem.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/contact"
                    className="px-6 py-3 bg-white text-[#0058c3] font-bold rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 active:scale-95 no-underline"
                  >
                    <span className="material-symbols-outlined">mail</span>
                    Contact Privacy Team
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WebsiteLayout>
  );
}
