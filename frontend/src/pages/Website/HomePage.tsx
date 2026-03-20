import { Link } from 'react-router-dom';
import WebsiteLayout from './components/WebsiteLayout';

export default function HomePage() {
  return (
    <WebsiteLayout>
      {/* Hero Section */}
      <section
        className="relative min-h-[90vh] flex items-center overflow-hidden px-6 lg:px-20"
        style={{ background: '#f8f9fa' }}
      >
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-[#0058c3]/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#a6c1fe]/20 rounded-full blur-[100px]"></div>
        </div>

        <div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8e2ff] text-[#004397] text-[10px] font-bold uppercase tracking-widest mb-6">
              <span className="flex h-2 w-2 rounded-full bg-[#0058c3]"></span>
              Now Live
            </div>
            <h1
              className="text-6xl md:text-7xl font-extrabold tracking-tighter leading-[1.1] mb-6"
              style={{ color: '#191c1d' }}
            >
              The Automation{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #0058c3 0%, #0070f3 100%)' }}
              >
                Engine
              </span>{' '}
              for Modern Teams.
            </h1>
            <p className="text-lg leading-relaxed mb-10 max-w-lg" style={{ color: '#414754' }}>
              ERP.js unifies your CRM, workflows, and analytics into a single high-performance
              canvas. Built for developers, scaled for enterprise.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/signup"
                className="px-8 py-4 bg-gradient-to-br from-[#0058c3] to-[#0070f3] text-white rounded-xl font-semibold text-lg shadow-xl hover:shadow-[#0058c3]/20 transition-all hover:-translate-y-1 active:scale-95 no-underline"
              >
                Start Free Trial
              </Link>
              <Link
                to="/contact"
                className="px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#e7e8e9] transition-all active:scale-95 no-underline"
                style={{ background: '#e1e3e4', color: '#191c1d' }}
              >
                Book Demo
              </Link>
            </div>
          </div>

          {/* 3D Component Placeholder */}
          <div className="relative hidden lg:flex justify-center items-center h-[600px]">
            <div
              className="absolute w-[400px] h-[400px] rounded-[2rem] transform rotate-12 -translate-x-12 -translate-y-12 flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid rgba(255,255,255,0.4)',
                borderLeft: '1px solid rgba(255,255,255,0.4)',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                borderRight: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <div className="w-32 h-32 bg-[#0058c3]/20 rounded-xl border border-[#0058c3]/30 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[#0058c3] text-5xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  account_tree
                </span>
              </div>
            </div>
            <div
              className="absolute w-[300px] h-[300px] rounded-[2rem] transform -rotate-6 translate-x-12 translate-y-12 flex items-center justify-center z-20"
              style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid rgba(255,255,255,0.4)',
                borderLeft: '1px solid rgba(255,255,255,0.4)',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                borderRight: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <div className="w-24 h-24 bg-[#0058c3] rounded-xl flex items-center justify-center shadow-2xl">
                <span
                  className="material-symbols-outlined text-white text-4xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  bolt
                </span>
              </div>
            </div>
            <div
              className="absolute w-[200px] h-[200px] rounded-[2rem] transform rotate-45 -translate-y-48 translate-x-32 flex items-center justify-center opacity-60"
              style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid rgba(255,255,255,0.4)',
                borderLeft: '1px solid rgba(255,255,255,0.4)',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                borderRight: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <span className="material-symbols-outlined text-[#0058c3] text-3xl">smart_toy</span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section
        className="py-12 border-y border-[#c1c6d7]/10 overflow-hidden"
        style={{ background: '#f3f4f5' }}
      >
        <div className="container mx-auto px-6">
          <p
            className="text-center text-[10px] font-bold uppercase tracking-widest mb-10"
            style={{ color: '#414754' }}
          >
            Trusted by high-growth engineering teams
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40">
            {['Stripe', 'Vercel', 'Linear', 'Framer', 'Retool'].map((name) => (
              <span key={name} className="text-xl font-bold tracking-tighter text-slate-400">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Bento Box */}
      <section className="py-24 px-6" style={{ background: '#f8f9fa' }}>
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
              style={{ color: '#191c1d' }}
            >
              One engine. Total <span className="text-[#0058c3]">Clarity</span>.
            </h2>
            <p className="max-w-2xl mx-auto" style={{ color: '#414754' }}>
              Eliminate tool sprawl with a unified system built on the most advanced data engine in
              the market.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* CRM Large Card */}
            <div
              className="md:col-span-8 rounded-2xl p-8 flex flex-col justify-between overflow-hidden relative group"
              style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid rgba(255,255,255,0.4)',
                borderLeft: '1px solid rgba(255,255,255,0.4)',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                borderRight: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <div className="relative z-10">
                <span className="material-symbols-outlined text-[#0058c3] mb-4 text-3xl">
                  contacts
                </span>
                <h3 className="text-2xl font-bold mb-2">High-Velocity CRM</h3>
                <p className="max-w-sm mb-6" style={{ color: '#414754' }}>
                  Manage pipeline complexity with an interface designed for speed and real-time
                  synchronization.
                </p>
              </div>
              <div
                className="mt-auto h-48 rounded-xl border border-[#c1c6d7]/30 p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 overflow-hidden"
                style={{ background: '#e7e8e9' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <div className="w-3 h-3 rounded-full bg-[#0058c3]"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-3/4 bg-white/50 rounded"></div>
                  <div className="h-4 w-1/2 bg-white/50 rounded"></div>
                  <div className="h-4 w-5/6 bg-white/50 rounded"></div>
                </div>
              </div>
            </div>

            {/* AI Assistant */}
            <div className="md:col-span-4 bg-[#0058c3] p-8 rounded-2xl flex flex-col text-white group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
                <span
                  className="material-symbols-outlined text-8xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  smart_toy
                </span>
              </div>
              <span className="material-symbols-outlined mb-4 text-3xl">psychology</span>
              <h3 className="text-2xl font-bold mb-2">Predictive AI</h3>
              <p className="text-[#d8e2ff] leading-relaxed mb-6">
                Automate routine decision-making with built-in machine learning models that learn
                from your data.
              </p>
              <Link
                to="/features"
                className="mt-auto flex items-center gap-2 font-semibold text-sm text-white no-underline"
              >
                Explore AI Engine{' '}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            {/* Workflow Automation */}
            <div
              className="md:col-span-4 rounded-2xl p-8 flex flex-col border border-[#c1c6d7]/10"
              style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid rgba(255,255,255,0.4)',
                borderLeft: '1px solid rgba(255,255,255,0.4)',
              }}
            >
              <span className="material-symbols-outlined text-[#0058c3] mb-4 text-3xl">
                account_tree
              </span>
              <h3 className="text-xl font-bold mb-2">Workflows</h3>
              <p className="text-sm mb-6" style={{ color: '#414754' }}>
                Low-code automation for high-impact operations. Drag, drop, deploy.
              </p>
              <div className="flex flex-col gap-2 opacity-50">
                <div
                  className="flex items-center gap-3 p-2 rounded"
                  style={{ background: '#f3f4f5' }}
                >
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span className="text-xs font-medium">If &apos;Invoice Paid&apos;</span>
                </div>
                <div
                  className="flex items-center gap-3 p-2 rounded translate-x-4"
                  style={{ background: '#f3f4f5' }}
                >
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  <span className="text-xs font-medium">Then &apos;Notify Slack&apos;</span>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div
              className="md:col-span-8 rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-center border border-[#c1c6d7]/10"
              style={{
                background: 'linear-gradient(to bottom right, rgba(255,255,255,0.4), #f3f4f5)',
              }}
            >
              <div className="flex-1">
                <span className="material-symbols-outlined text-[#0058c3] mb-4 text-3xl">
                  analytics
                </span>
                <h3 className="text-2xl font-bold mb-2">Deep Analytics</h3>
                <p style={{ color: '#414754' }}>
                  Real-time business intelligence with zero latency. Turn complex data points into
                  actionable executive dashboards instantly.
                </p>
              </div>
              <div className="flex-1 w-full h-full min-h-[160px] bg-white rounded-xl shadow-inner border border-[#c1c6d7]/20 relative overflow-hidden p-4">
                <div className="flex items-end gap-2 h-full justify-around">
                  <div className="w-4 bg-[#0058c3]/20 h-[30%] rounded-t"></div>
                  <div className="w-4 bg-[#0058c3]/40 h-[60%] rounded-t"></div>
                  <div className="w-4 bg-[#0058c3] h-[80%] rounded-t"></div>
                  <div className="w-4 bg-[#0058c3]/30 h-[45%] rounded-t"></div>
                  <div className="w-4 bg-[#0058c3]/60 h-[70%] rounded-t"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <div
            className="rounded-[2rem] p-12 md:p-20 text-center relative overflow-hidden"
            style={{ background: '#2e3132' }}
          >
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#0058c3] rounded-full blur-[100px]"></div>
              <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#a6c1fe] rounded-full blur-[100px]"></div>
            </div>
            <h2
              className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-6 relative z-10"
              style={{ color: '#f0f1f2' }}
            >
              Ready to rebuild your ops?
            </h2>
            <p
              className="max-w-xl mx-auto mb-10 text-lg relative z-10"
              style={{ color: '#c1c6d7' }}
            >
              Join thousands of enterprises running their entire operation on ERP.js. Scale without
              the technical debt.
            </p>
            <div className="flex flex-wrap justify-center gap-4 relative z-10">
              <Link
                to="/signup"
                className="px-10 py-4 bg-[#0058c3] text-white rounded-xl font-bold hover:bg-[#0070f3] transition-all shadow-xl no-underline"
              >
                Deploy Now
              </Link>
              <Link
                to="/contact"
                className="px-10 py-4 bg-white/10 text-white backdrop-blur-md rounded-xl font-bold hover:bg-white/20 transition-all border border-white/20 no-underline"
              >
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
}
