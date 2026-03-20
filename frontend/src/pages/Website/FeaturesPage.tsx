import WebsiteLayout from './components/WebsiteLayout';

export default function FeaturesPage() {
  return (
    <WebsiteLayout title="Features">
      <div className="pt-10 pb-20 overflow-hidden font-inter">
        {/* Hero Header */}
        <section className="max-w-7xl mx-auto px-6 mb-24 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-[#d8e2ff] text-[#2a467b] text-[0.6875rem] font-bold uppercase tracking-wider mb-6">
            Platform Capabilities
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6" style={{ color: '#191c1d' }}>
            Engineered for <span className="text-[#0058c3]">Precision</span>.
          </h1>
          <p className="max-w-2xl mx-auto text-lg leading-relaxed" style={{ color: '#414754' }}>
            Experience the next evolution of enterprise resource planning. A crystalline suite of tools
            designed for the modern developer-led organization.
          </p>
        </section>

        {/* Feature Block 1: Sales CRM */}
        <section className="max-w-7xl mx-auto px-6 mb-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="w-12 h-12 rounded-xl bg-[#0058c3]/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[#0058c3]">contacts</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-4" style={{ color: '#191c1d' }}>
                Sales CRM
              </h2>
              <p className="mb-8 leading-relaxed" style={{ color: '#414754' }}>
                Manage your entire pipeline with surgical precision. Our CRM uses tonal layering to
                highlight high-priority deals without cluttering your workspace.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm font-medium" style={{ color: '#191c1d' }}>
                  <span className="material-symbols-outlined text-[#0058c3] text-lg">check_circle</span>
                  Automated Lead Scoring
                </li>
                <li className="flex items-center gap-3 text-sm font-medium" style={{ color: '#191c1d' }}>
                  <span className="material-symbols-outlined text-[#0058c3] text-lg">check_circle</span>
                  Real-time Revenue Forecasting
                </li>
              </ul>
            </div>
            <div className="order-1 md:order-2 relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-[#0058c3]/20 to-transparent blur-3xl opacity-30 rounded-full"></div>
              <div
                className="rounded-xl p-4 shadow-2xl relative overflow-hidden border border-[#c1c6d7]/20"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(12px)',
                  borderTop: '1px solid rgba(255,255,255,0.4)',
                  borderLeft: '1px solid rgba(255,255,255,0.4)',
                }}
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
                  <div className="h-12 w-full bg-white rounded-lg flex items-center px-4 justify-between border border-[#c1c6d7]/10 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100"></div>
                      <div className="h-3 w-20 bg-slate-100 rounded"></div>
                    </div>
                    <div className="h-6 w-16 bg-[#0058c3]/10 rounded-full"></div>
                  </div>
                  <div className="h-24 w-full bg-white/40 rounded-lg border border-white/60 p-4">
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
              <div className="rounded-xl p-8 shadow-xl relative overflow-hidden border border-[#c1c6d7]/20" style={{ background: '#f3f4f5' }}>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className="p-4 rounded-lg"
                    style={{
                      background: 'rgba(255,255,255,0.7)',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    <span className="material-symbols-outlined text-[#0058c3] mb-2">mail</span>
                    <div className="h-2 w-16 bg-slate-300 rounded mb-2"></div>
                    <div className="h-1.5 w-full bg-slate-100 rounded"></div>
                  </div>
                  <div
                    className="p-4 rounded-lg transform translate-y-8"
                    style={{
                      background: 'rgba(255,255,255,0.7)',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    <span className="material-symbols-outlined text-[#0058c3] mb-2">bolt</span>
                    <div className="h-2 w-16 bg-slate-300 rounded mb-2"></div>
                    <div className="h-1.5 w-full bg-slate-100 rounded"></div>
                  </div>
                </div>
                <div
                  className="mt-12 p-4 rounded-lg"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded bg-[#0070f3]"></div>
                    <div className="space-y-1">
                      <div className="h-2 w-24 bg-slate-400 rounded"></div>
                      <div className="h-1.5 w-32 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded"></div>
                </div>
              </div>
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#435d94]/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[#435d94]">smart_toy</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-4" style={{ color: '#191c1d' }}>
                Marketing Automation
              </h2>
              <p className="mb-8 leading-relaxed" style={{ color: '#414754' }}>
                Trigger multi-channel campaigns based on user behavior. Our automation engine is an
                isometric workspace where logic flows like light through a prism.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg" style={{ background: '#e1e3e4' }}>
                  <div className="text-xl font-bold text-[#0058c3] mb-1">98%</div>
                  <div className="text-[0.6875rem] font-bold uppercase tracking-wider" style={{ color: '#414754' }}>
                    Deliverability
                  </div>
                </div>
                <div className="p-4 rounded-lg" style={{ background: '#e1e3e4' }}>
                  <div className="text-xl font-bold text-[#0058c3] mb-1">12x</div>
                  <div className="text-[0.6875rem] font-bold uppercase tracking-wider" style={{ color: '#414754' }}>
                    ROI Increase
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Block 3: Reputation Management */}
        <section className="max-w-7xl mx-auto px-6 mb-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="w-12 h-12 rounded-xl bg-[#a23d00]/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[#a23d00]">verified</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-4" style={{ color: '#191c1d' }}>
                Reputation Management
              </h2>
              <p className="mb-8 leading-relaxed" style={{ color: '#414754' }}>
                Monitor sentiment across the web. Our AI Assistant distills complex feedback into
                actionable insights, visualised through high-contrast glass dashboards.
              </p>
              <button className="flex items-center gap-2 text-[#0058c3] font-semibold text-sm hover:gap-3 transition-all bg-transparent border-none cursor-pointer">
                Explore Insights
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
            <div className="order-1 md:order-2">
              <div
                className="rounded-xl p-6 shadow-xl border border-[#c1c6d7]/10"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="flex gap-4 mb-6">
                  <div className="w-full h-32 bg-white/50 rounded-lg flex flex-col items-center justify-center border border-white/80">
                    <span
                      className="material-symbols-outlined text-4xl text-amber-400"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <div className="text-2xl font-bold mt-2">4.9</div>
                  </div>
                  <div className="w-full h-32 bg-white/50 rounded-lg border border-white/80 p-4 space-y-3">
                    <div className="h-1.5 w-full bg-slate-100 rounded overflow-hidden">
                      <div className="h-full w-4/5 bg-emerald-500"></div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded overflow-hidden">
                      <div className="h-full w-1/5 bg-amber-500"></div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded overflow-hidden">
                      <div className="h-full w-[2%] bg-red-500"></div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-[#0058c3]/5 rounded-lg border border-[#0058c3]/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[#0058c3] text-sm">auto_awesome</span>
                    <span className="text-[0.6875rem] font-bold text-[#0058c3] uppercase tracking-widest">
                      AI Insight
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: '#414754' }}>
                    &ldquo;Sentiment is trending positive in the EMEA region following the latest
                    launch.&rdquo;
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
              <div className="absolute -inset-10 bg-[#0058c3]/5 blur-3xl rounded-full transition-opacity group-hover:opacity-100 opacity-50"></div>
              <div className="relative bg-white border border-[#c1c6d7]/30 rounded-xl p-8 shadow-2xl">
                <div className="flex justify-between items-start mb-10">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-slate-900 rounded"></div>
                    <div className="h-2 w-24 bg-slate-200 rounded"></div>
                  </div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#edeeef' }}>
                    <span className="material-symbols-outlined text-slate-400">draw</span>
                  </div>
                </div>
                <div className="space-y-3 mb-12">
                  <div className="h-2 w-full bg-slate-100 rounded"></div>
                  <div className="h-2 w-full bg-slate-100 rounded"></div>
                  <div className="h-2 w-2/3 bg-slate-100 rounded"></div>
                </div>
                <div className="h-20 w-full border-2 border-dashed border-[#0058c3]/20 rounded-lg flex items-center justify-center bg-[#0058c3]/[0.02]">
                  <span className="text-[#0058c3] text-xs font-mono italic">
                    Click to sign electronically
                  </span>
                </div>
              </div>
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-white">history_edu</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-4" style={{ color: '#191c1d' }}>
                Document Signing
              </h2>
              <p className="mb-8 leading-relaxed" style={{ color: '#414754' }}>
                Close deals faster with integrated e-signatures. Legally binding, cryptographically
                secure, and natively embedded into your ERP workflows.
              </p>
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold" style={{ color: '#191c1d' }}>SOC2</span>
                  <span className="text-[0.6875rem] uppercase font-bold tracking-widest" style={{ color: '#414754' }}>
                    Compliant
                  </span>
                </div>
                <div className="h-10 w-[1px]" style={{ background: '#c1c6d7' }}></div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold" style={{ color: '#191c1d' }}>AES-256</span>
                  <span className="text-[0.6875rem] uppercase font-bold tracking-widest" style={{ color: '#414754' }}>
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
