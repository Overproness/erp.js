import { Link } from 'react-router-dom';
import WebsiteLayout from './components/WebsiteLayout';

const aboutStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'AboutPage',
      '@id': 'https://yourdomain.com/about#webpage',
      url: 'https://yourdomain.com/about',
      name: 'About Us | ERP.js Enterprise Automation Engine',
      description:
        'Meet the team and mission behind ERP.js. Decentralizing enterprise operational power with an open, modular, developer-first automation suite.',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://yourdomain.com/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'About',
            item: 'https://yourdomain.com/about',
          },
        ],
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://yourdomain.com/#organization',
      name: 'ERP.js',
      url: 'https://yourdomain.com/',
      logo: 'https://yourdomain.com/logo-bg-remove.png',
      description:
        'Open source enterprise resource planning and workflow automation suite.',
    },
  ],
};

export default function AboutPage() {
  return (
    <WebsiteLayout
      title="About Us: Building the Open Source Automation Suite"
      description="Meet the team and mission behind ERP.js. Decentralizing enterprise operational power with an open, modular, developer-first automation suite."
      canonicalPath="/about"
      keywords="about ERP.js, open source ERP mission, enterprise software team, developer-first ERP"
      structuredData={aboutStructuredData}
    >
      {/* Hero Section */}
      <section
        className="relative py-24 px-6 font-sans"
        style={{
          background:
            'radial-gradient(circle at top right, rgba(0, 88, 195, 0.08), transparent 40%), radial-gradient(circle at bottom left, rgba(0, 112, 243, 0.05), transparent 40%)',
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <span className="text-xs font-heading font-semibold uppercase tracking-wider text-[#0058c3] mb-4 block">
            Our Vision
          </span>
          <h1
            className="font-heading text-5xl md:text-7xl font-extrabold tracking-tight mb-8 max-w-4xl"
            style={{ color: '#191c1d' }}
          >
            Engineering the{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #0058c3 0%, #0070f3 100%)' }}
            >
              Automation Engine
            </span>{' '}
            for global scale.
          </h1>
          <p className="max-w-2xl leading-relaxed text-lg text-slate-600 font-sans">
            We believe complex enterprise systems should not feel like an opaque box. Our mission
            is to refract business operations through a clear lens, providing the precision of a
            high-performance engine with complete transparency.
          </p>
        </div>
        {/* Decorative isometric element */}
        <div className="absolute -right-20 top-40 opacity-20 hidden lg:block">
          <div className="w-96 h-96 border-[#0058c3]/20 border-8 transform rotate-45 flex items-center justify-center">
            <div className="w-64 h-64 border-[#0058c3]/40 border-4"></div>
          </div>
        </div>
      </section>

      {/* Mission Statement / Bento Grid */}
      <section className="py-20 px-6 font-sans" style={{ background: '#f3f4f5' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div
              className="md:col-span-7 p-10 rounded-xl shadow-sm border border-[#c1c6d7]/20 bg-white"
            >
              <span
                className="material-symbols-outlined text-[#0058c3] text-4xl mb-6"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                account_tree
              </span>
              <h2
                className="font-heading text-3xl font-bold tracking-tight mb-4 text-slate-900"
              >
                The Mission
              </h2>
              <p className="leading-relaxed text-lg text-slate-600">
                To decentralize enterprise operational power. By building an open, modular, and
                developer-first automation suite, we empower teams to build exactly what they need
                without proprietary lock-in. We prioritize technical excellence, performance, and
                operational freedom.
              </p>
            </div>
            <div className="md:col-span-5 bg-gradient-to-br from-[#0058c3] to-[#0070f3] p-10 rounded-xl flex flex-col justify-end text-white shadow-sm">
              <h3 className="font-heading text-2xl font-bold mb-2">100% Modularity</h3>
              <p className="opacity-90 leading-relaxed font-sans text-sm">
                Every component in ERP.js operates as an independent, extensible module accessible
                through structured REST and GraphQL APIs.
              </p>
            </div>
            <div
              className="md:col-span-4 p-8 rounded-xl border border-[#c1c6d7]/20 bg-white shadow-sm"
            >
              <h3 className="font-heading text-xl font-bold mb-2 text-slate-900">
                Transparency
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Real-time telemetry for every business logic process, visualized through an intuitive
                dashboard canvas.
              </p>
            </div>
            <div
              className="md:col-span-4 p-8 rounded-xl border border-[#c1c6d7]/20 bg-white shadow-sm"
            >
              <h3 className="font-heading text-xl font-bold mb-2 text-slate-900">
                Velocity
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Deploy mission-critical workflows in minutes instead of quarters. Built for speed and
                continuous evolution.
              </p>
            </div>
            <div
              className="md:col-span-4 p-8 rounded-xl border border-[#c1c6d7]/20 bg-white shadow-sm"
            >
              <h3 className="font-heading text-xl font-bold mb-2 text-slate-900">
                Integrity
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Immutable ledger systems ensure that your operational records remain the single,
                uncompromised source of truth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-slate-200 bg-white font-sans">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6 text-slate-900">
            Ready to experience the automation engine?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-[#0058c3] text-white px-8 py-3 rounded-lg font-heading font-bold shadow-lg hover:bg-[#0070f3] transition-colors no-underline"
            >
              Get Started Today
            </Link>
            <Link
              to="/features"
              className="px-8 py-3 rounded-lg font-heading font-bold hover:bg-[#e1e3e4] transition-colors no-underline border border-slate-300 text-slate-900"
            >
              View Features
            </Link>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
}
