import WebsiteLayout from './components/WebsiteLayout';

const featuresStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': 'https://yourdomain.com/features#webpage',
      url: 'https://yourdomain.com/features',
      name: 'Features | ERP.js Enterprise Automation Suite',
      description:
        'Explore ERP.js platform capabilities: Sales CRM, workflow automation, analytics, and document signing. Engineered for precision and enterprise scale.',
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
            name: 'Features',
            item: 'https://yourdomain.com/features',
          },
        ],
      },
    },
  ],
};

export default function FeaturesPage() {
  return (
    <WebsiteLayout
      title="Platform Features: Sales CRM, Workflows and Analytics"
      description="Explore ERP.js platform capabilities: Sales CRM, workflow automation, analytics, and document signing. Engineered for precision and enterprise scale."
      canonicalPath="/features"
      keywords="CRM features, workflow automation engine, business analytics, document signing, enterprise software, open source ERP features"
      structuredData={featuresStructuredData}
    >
      <div className="pt-10 pb-20 overflow-hidden font-sans">
        {/* Hero Header */}
        <section className="max-w-7xl mx-auto px-6 mb-24 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-[#d8e2ff] text-[#004397] text-[11px] font-bold uppercase tracking-wider mb-6">
            Platform Capabilities
          </div>
          <h1
            className="font-heading text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
            style={{ color: '#191c1d' }}
          >
            Engineered for <span className="text-[#0058c3]">Precision</span>.
          </h1>
          <p className="max-w-2xl mx-auto text-lg leading-relaxed text-slate-600">
            Experience the next evolution of enterprise resource planning. A modern suite of
            tools designed for developer-led organizations and operational excellence.
          </p>
        </section>

        {/* Feature Block 1: Sales CRM */}
        <section className="max-w-7xl mx-auto px-6 mb-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="w-12 h-12 rounded-xl bg-[#0058c3]/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[#0058c3]">contacts</span>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: '#191c1d' }}>
                Sales CRM and Deal Pipelines
              </h2>
              <p className="mb-8 leading-relaxed text-slate-600">
                Manage your entire pipeline with surgical precision. Our CRM uses tonal layering to
                highlight high-priority deals without cluttering your workspace.
              </p>
              <ul className="space-y-4">
                <li
                  className="flex items-center gap-3 text-sm font-medium"
                  style={{ color: '#191c1d' }}
                >
                  <span className="material-symbols-outlined text-[#0058c3] text-lg">
                    check_circle
                  </span>
                  Automated Lead Scoring and Qualification
                </li>
                <li
                  className="flex items-center gap-3 text-sm font-medium"
                  style={{ color: '#191c1d' }}
                >
                  <span className="material-symbols-outlined text-[#0058c3] text-lg">
                    check_circle
                  </span>
                  Real-time Revenue Forecasting
                </li>
              </ul>
            </div>
            <div className="order-1 md:order-2 relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-[#0058c3]/20 to-transparent blur-3xl opacity-30 rounded-full"></div>
              <div
                className="rounded-xl p-4 shadow-xl relative overflow-hidden border border-[#c1c6d7]/20 bg-white"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                  </div>
                  <div className="h-2 w-32 bg-[#edeeef] rounded-full"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-12 w-full bg-slate-50 rounded-lg flex items-center px-4 justify-between border border-[#c1c6d7]/10 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                      <div className="h-3 w-20 bg-slate-200 rounded"></div>
                    </div>
                    <div className="h-6 w-16 bg-[#0058c3]/10 rounded-full"></div>
                  </div>
                  <div className="h-24 w-full bg-slate-50 rounded-lg border border-slate-200/60 p-4">
                    <div className="h-2 w-1/2 bg-slate-200 rounded mb-4"></div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="h-8 bg-[#0058c3]/20 rounded-sm"></div>
                      <div className="h-10 bg-[#0058c3]/40 rounded-sm"></div>
                      <div className="h-6 bg-[#0058c3]/10 rounded-sm"></div>
                      <div className="h-12 bg-[#0058c3]/60 rounded-sm"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Block 2: Marketing Automation */}
        <section className="max-w-7xl mx-auto px-6 mb-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-bl from-[#435d94]/20 to-transparent blur-3xl opacity-30 rounded-full"></div>
              <div
                className="rounded-xl p-8 shadow-xl relative overflow-hidden border border-[#c1c6d7]/20 bg-white"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className="p-4 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <span className="material-symbols-outlined text-[#0058c3] mb-2">mail</span>
                    <div className="h-2 w-16 bg-slate-300 rounded mb-2"></div>
                    <div className="h-1.5 w-full bg-slate-200 rounded"></div>
                  </div>
                  <div
                    className="p-4 rounded-lg transform translate-y-6 bg-slate-50 border border-slate-100"
                  >
                    <span className="material-symbols-outlined text-[#0058c3] mb-2">bolt</span>
                    <div className="h-2 w-16 bg-slate-300 rounded mb-2"></div>
                    <div className="h-1.5 w-full bg-slate-200 rounded"></div>
                  </div>
                </div>
                <div
                  className="mt-10 p-4 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded bg-[#0070f3]"></div>
                    <div className="space-y-1">
                      <div className="h-2 w-24 bg-slate-400 rounded"></div>
                      <div className="h-1.5 w-32 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded"></div>
                </div>
              </div>
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#435d94]/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[#435d94]">smart_toy</span>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: '#191c1d' }}>
                Multi-Channel Automation
              </h2>
              <p className="mb-8 leading-relaxed text-slate-600">
                Trigger multi-channel campaigns based on user behavior. Our automation engine
                provides an intuitive canvas where operational logic executes reliably at scale.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white border border-slate-200">
                  <div className="font-heading text-2xl font-bold text-[#0058c3] mb-1">98%</div>
                  <div
                    className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    Deliverability
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-white border border-slate-200">
                  <div className="font-heading text-2xl font-bold text-[#0058c3] mb-1">12x</div>
                  <div
                    className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    Efficiency Boost
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Block 3: Analytics and Reputation */}
        <section className="max-w-7xl mx-auto px-6 mb-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="w-12 h-12 rounded-xl bg-[#a23d00]/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[#a23d00]">verified</span>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: '#191c1d' }}>
                Reputation and Customer Sentiment
              </h2>
              <p className="mb-8 leading-relaxed text-slate-600">
                Monitor sentiment and feedback across customer touchpoints. Our AI Assistant
                distills operational feedback into actionable, high-impact insights.
              </p>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#0058c3]">insights</span>
                <span className="font-heading font-semibold text-sm text-[#0058c3]">Continuous Real-time Evaluation</span>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div
                className="rounded-xl p-6 shadow-xl border border-slate-200 bg-white"
              >
                <div className="flex gap-4 mb-6">
                  <div className="w-full h-32 bg-slate-50 rounded-lg flex flex-col items-center justify-center border border-slate-100">
                    <span
                      className="material-symbols-outlined text-4xl text-amber-500"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <div className="font-heading text-2xl font-bold mt-2 text-slate-900">4.9</div>
                  </div>
                  <div className="w-full h-32 bg-slate-50 rounded-lg border border-slate-100 p-4 space-y-3">
                    <div className="h-1.5 w-full bg-slate-200 rounded overflow-hidden">
                      <div className="h-full w-4/5 bg-emerald-500"></div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded overflow-hidden">
                      <div className="h-full w-1/5 bg-amber-500"></div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded overflow-hidden">
                      <div className="h-full w-[2%] bg-red-500"></div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[#0058c3] text-sm">
                      auto_awesome
                    </span>
                    <span className="text-[11px] font-bold text-[#0058c3] uppercase tracking-wider">
                      Sentiment Analysis
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">
                    Sentiment metrics trend positive across all business accounts following release cycle.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Block 4: Document Signing */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative group">
              <div className="absolute -inset-10 bg-[#0058c3]/5 blur-3xl rounded-full"></div>
              <div className="relative bg-white border border-slate-200 rounded-xl p-8 shadow-xl">
                <div className="flex justify-between items-start mb-8">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-slate-900 rounded"></div>
                    <div className="h-2 w-24 bg-slate-200 rounded"></div>
                  </div>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-100"
                  >
                    <span className="material-symbols-outlined text-slate-500">draw</span>
                  </div>
                </div>
                <div className="space-y-3 mb-8">
                  <div className="h-2 w-full bg-slate-100 rounded"></div>
                  <div className="h-2 w-full bg-slate-100 rounded"></div>
                  <div className="h-2 w-2/3 bg-slate-100 rounded"></div>
                </div>
                <div className="h-20 w-full border-2 border-dashed border-[#0058c3]/30 rounded-lg flex items-center justify-center bg-blue-50/50">
                  <span className="text-[#0058c3] text-xs font-mono font-medium">
                    Cryptographic Electronic Signature Area
                  </span>
                </div>
              </div>
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-white">history_edu</span>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: '#191c1d' }}>
                Integrated Document Signing
              </h2>
              <p className="mb-8 leading-relaxed text-slate-600">
                Close deals faster with integrated e-signatures. Legally recognized, cryptographically
                secure, and natively embedded into your ERP workflows.
              </p>
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="font-heading text-2xl font-bold text-slate-900">
                    SOC2
                  </span>
                  <span
                    className="text-[11px] uppercase font-bold tracking-widest text-slate-500"
                  >
                    Ready Architecture
                  </span>
                </div>
                <div className="h-10 w-[1px] bg-slate-200"></div>
                <div className="flex flex-col">
                  <span className="font-heading text-2xl font-bold text-slate-900">
                    AES-256
                  </span>
                  <span
                    className="text-[11px] uppercase font-bold tracking-widest text-slate-500"
                  >
                    Encryption
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </WebsiteLayout>
  );
}
