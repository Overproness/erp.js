import { useState } from 'react';
import { Link } from 'react-router-dom';
import WebsiteLayout from './components/WebsiteLayout';

const faqs = [
  {
    q: 'Can I switch plans later?',
    a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle. If you upgrade, the price difference will be pro-rated for the remainder of the current month.',
  },
  {
    q: 'How long does enterprise setup take?',
    a: 'Enterprise deployment typically takes 2-4 weeks, depending on the complexity of your custom integrations and data migration requirements. Our solutions engineers will be with you every step of the way.',
  },
  {
    q: 'Do you offer educational or non-profit discounts?',
    a: 'Absolutely. We support organizations making a positive impact. Please reach out to our sales team with your proof of status to receive our non-profit pricing details.',
  },
  {
    q: 'Is my data secure on the cloud?',
    a: 'Quickmation uses military-grade encryption for all data at rest and in transit. We are SOC2 Type II compliant and offer advanced security features like SSO and audit logs on our higher-tier plans.',
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <WebsiteLayout title="Pricing">
      <div className="pt-20 pb-24 px-6 max-w-7xl mx-auto font-inter">
        {/* Hero Header */}
        <header className="text-center mb-20">
          <h1
            className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-6"
            style={{ color: '#191c1d' }}
          >
            Pricing that scales <br />
            with your growth.
          </h1>
          <p className="max-w-2xl mx-auto text-lg" style={{ color: '#414754' }}>
            The Crystalline Engine powers enterprises of all sizes. Choose the layer that fits your
            operational needs.
          </p>
        </header>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-32">
          {/* Starter Tier */}
          <div
            className="p-8 rounded-xl flex flex-col transition-all hover:-translate-y-1 duration-300"
            style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(255,255,255,0.4)',
              borderLeft: '1px solid rgba(255,255,255,0.4)',
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              borderRight: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <div className="mb-8">
              <span
                className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded"
                style={{ color: '#414754', background: '#e7e8e9' }}
              >
                Starter
              </span>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight" style={{ color: '#191c1d' }}>
                  $49
                </span>
                <span style={{ color: '#414754' }}>/mo</span>
              </div>
              <p className="mt-2 text-sm" style={{ color: '#414754' }}>
                Perfect for emerging teams.
              </p>
            </div>
            <ul className="space-y-4 mb-10 flex-grow list-none p-0">
              <li className="flex items-center gap-3 text-sm">
                <span className="material-symbols-outlined text-[#0058c3] text-lg">
                  check_circle
                </span>
                10 Users
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="material-symbols-outlined text-[#0058c3] text-lg">
                  check_circle
                </span>
                CRM
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="material-symbols-outlined text-[#0058c3] text-lg">
                  check_circle
                </span>
                Basic Workflows
              </li>
              <li className="flex items-center gap-3 text-sm opacity-40">
                <span className="material-symbols-outlined text-lg">cancel</span>
                AI Assistant
              </li>
            </ul>
            <Link
              to="/signup"
              className="w-full text-center py-3 rounded-lg font-semibold transition-colors no-underline block"
              style={{ background: '#e7e8e9', color: '#191c1d' }}
            >
              Start Basic
            </Link>
          </div>

          {/* Pro Tier (Highlighted) */}
          <div
            className="p-8 rounded-xl flex flex-col relative border-2 border-[#0058c3]/20 z-10 bg-white/80 transition-all hover:-translate-y-1 duration-300 md:scale-105"
            style={{
              boxShadow: '0 0 40px rgba(0, 88, 195, 0.15)',
              background: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0058c3] text-white text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full">
              Most Popular
            </div>
            <div className="mb-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0058c3] bg-[#d8e2ff] px-2 py-1 rounded">
                Pro
              </span>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight" style={{ color: '#191c1d' }}>
                  $149
                </span>
                <span style={{ color: '#414754' }}>/mo</span>
              </div>
              <p className="mt-2 text-sm" style={{ color: '#414754' }}>
                Advanced tools for scaling ops.
              </p>
            </div>
            <ul className="space-y-4 mb-10 flex-grow list-none p-0">
              <li className="flex items-center gap-3 text-sm font-medium">
                <span
                  className="material-symbols-outlined text-[#0058c3] text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                Unlimited Users
              </li>
              <li className="flex items-center gap-3 text-sm font-medium">
                <span
                  className="material-symbols-outlined text-[#0058c3] text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                CRM + Automation
              </li>
              <li className="flex items-center gap-3 text-sm font-medium">
                <span
                  className="material-symbols-outlined text-[#0058c3] text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  auto_awesome
                </span>
                AI Assistant
              </li>
              <li className="flex items-center gap-3 text-sm font-medium">
                <span
                  className="material-symbols-outlined text-[#0058c3] text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  analytics
                </span>
                Advanced Analytics
              </li>
            </ul>
            <Link
              to="/signup"
              className="w-full text-center bg-gradient-to-br from-[#0058c3] to-[#0070f3] text-white font-bold py-3 rounded-lg shadow-lg shadow-[#0058c3]/20 hover:opacity-90 transition-all active:scale-95 no-underline block"
            >
              Upgrade to Pro
            </Link>
          </div>

          {/* Enterprise Tier */}
          <div
            className="p-8 rounded-xl flex flex-col transition-all hover:-translate-y-1 duration-300"
            style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(255,255,255,0.4)',
              borderLeft: '1px solid rgba(255,255,255,0.4)',
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              borderRight: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <div className="mb-8">
              <span
                className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded"
                style={{ color: '#414754', background: '#e7e8e9' }}
              >
                Enterprise
              </span>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight" style={{ color: '#191c1d' }}>
                  Custom
                </span>
              </div>
              <p className="mt-2 text-sm" style={{ color: '#414754' }}>
                Bespoke engine for large scale.
              </p>
            </div>
            <ul className="space-y-4 mb-10 flex-grow list-none p-0">
              <li className="flex items-center gap-3 text-sm">
                <span className="material-symbols-outlined text-[#0058c3] text-lg">verified</span>
                Custom Solutions
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="material-symbols-outlined text-[#0058c3] text-lg">
                  support_agent
                </span>
                24/7 Priority Support
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="material-symbols-outlined text-[#0058c3] text-lg">security</span>
                SLA &amp; Custom Compliance
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="material-symbols-outlined text-[#0058c3] text-lg">hub</span>
                Unlimited Integrations
              </li>
            </ul>
            <Link
              to="/contact"
              className="w-full text-center py-3 rounded-lg font-semibold transition-colors no-underline block"
              style={{ background: '#e7e8e9', color: '#191c1d' }}
            >
              Contact Sales
            </Link>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold tracking-tight mb-4" style={{ color: '#191c1d' }}>
              Compare Features
            </h3>
            <p style={{ color: '#414754' }}>Find the perfect plan for your organizational goals.</p>
          </div>
          <div
            className="rounded-2xl overflow-hidden overflow-x-auto"
            style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(255,255,255,0.4)',
              borderLeft: '1px solid rgba(255,255,255,0.4)',
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              borderRight: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr style={{ background: '#f3f4f5' }}>
                  <th
                    className="p-6 text-sm font-bold uppercase tracking-wider text-left w-1/4"
                    style={{ color: '#414754' }}
                  >
                    Feature
                  </th>
                  <th
                    className="p-6 text-sm font-bold uppercase tracking-wider text-center w-1/4"
                    style={{ color: '#414754' }}
                  >
                    Starter
                  </th>
                  <th className="p-6 text-sm font-bold uppercase tracking-wider text-center w-1/4 text-[#0058c3]">
                    Pro
                  </th>
                  <th
                    className="p-6 text-sm font-bold uppercase tracking-wider text-center w-1/4"
                    style={{ color: '#414754' }}
                  >
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: 'rgba(255,255,255,0.3)' }}>
                  <td
                    colSpan={4}
                    className="p-6 text-sm font-bold"
                    style={{ color: '#191c1d', background: 'rgba(255,255,255,0.5)' }}
                  >
                    CRM &amp; Sales
                  </td>
                </tr>
                <tr className="border-t border-[#c1c6d7]/30">
                  <td className="p-6 text-sm" style={{ color: '#414754' }}>
                    Contact Management
                  </td>
                  <td className="p-6 text-center">
                    <span className="material-symbols-outlined text-[#0058c3]">check</span>
                  </td>
                  <td className="p-6 text-center">
                    <span className="material-symbols-outlined text-[#0058c3]">check</span>
                  </td>
                  <td className="p-6 text-center">
                    <span className="material-symbols-outlined text-[#0058c3]">check</span>
                  </td>
                </tr>
                <tr className="border-t border-[#c1c6d7]/30">
                  <td className="p-6 text-sm" style={{ color: '#414754' }}>
                    Lead Scoring
                  </td>
                  <td className="p-6 text-center text-xs" style={{ color: '#414754' }}>
                    —
                  </td>
                  <td className="p-6 text-center">
                    <span className="material-symbols-outlined text-[#0058c3]">check</span>
                  </td>
                  <td className="p-6 text-center">
                    <span className="material-symbols-outlined text-[#0058c3]">check</span>
                  </td>
                </tr>
                <tr style={{ background: 'rgba(255,255,255,0.3)' }}>
                  <td
                    colSpan={4}
                    className="p-6 text-sm font-bold"
                    style={{ color: '#191c1d', background: 'rgba(255,255,255,0.5)' }}
                  >
                    Workflows
                  </td>
                </tr>
                <tr className="border-t border-[#c1c6d7]/30">
                  <td className="p-6 text-sm" style={{ color: '#414754' }}>
                    Automated Rules
                  </td>
                  <td className="p-6 text-center text-sm">Up to 10</td>
                  <td className="p-6 text-center text-sm">Unlimited</td>
                  <td className="p-6 text-center text-sm">Unlimited</td>
                </tr>
                <tr className="border-t border-[#c1c6d7]/30">
                  <td className="p-6 text-sm" style={{ color: '#414754' }}>
                    Custom Engine
                  </td>
                  <td className="p-6 text-center text-xs" style={{ color: '#414754' }}>
                    —
                  </td>
                  <td className="p-6 text-center text-xs" style={{ color: '#414754' }}>
                    —
                  </td>
                  <td className="p-6 text-center">
                    <span className="material-symbols-outlined text-[#0058c3]">check</span>
                  </td>
                </tr>
                <tr style={{ background: 'rgba(255,255,255,0.3)' }}>
                  <td
                    colSpan={4}
                    className="p-6 text-sm font-bold"
                    style={{ color: '#191c1d', background: 'rgba(255,255,255,0.5)' }}
                  >
                    Artificial Intelligence
                  </td>
                </tr>
                <tr className="border-t border-[#c1c6d7]/30">
                  <td className="p-6 text-sm" style={{ color: '#414754' }}>
                    AI Copilot
                  </td>
                  <td className="p-6 text-center text-xs" style={{ color: '#414754' }}>
                    —
                  </td>
                  <td className="p-6 text-center text-sm">Standard</td>
                  <td className="p-6 text-center text-sm">Advanced</td>
                </tr>
                <tr className="border-t border-[#c1c6d7]/30">
                  <td className="p-6 text-sm" style={{ color: '#414754' }}>
                    Predictive Analytics
                  </td>
                  <td className="p-6 text-center text-xs" style={{ color: '#414754' }}>
                    —
                  </td>
                  <td className="p-6 text-center">
                    <span className="material-symbols-outlined text-[#0058c3]">check</span>
                  </td>
                  <td className="p-6 text-center">
                    <span className="material-symbols-outlined text-[#0058c3]">check</span>
                  </td>
                </tr>
                <tr style={{ background: 'rgba(255,255,255,0.3)' }}>
                  <td
                    colSpan={4}
                    className="p-6 text-sm font-bold"
                    style={{ color: '#191c1d', background: 'rgba(255,255,255,0.5)' }}
                  >
                    Support
                  </td>
                </tr>
                <tr className="border-t border-[#c1c6d7]/30">
                  <td className="p-6 text-sm" style={{ color: '#414754' }}>
                    Response Time
                  </td>
                  <td className="p-6 text-center text-sm">48h</td>
                  <td className="p-6 text-center text-sm">12h</td>
                  <td className="p-6 text-center text-sm">1h (SLA)</td>
                </tr>
                <tr className="border-t border-[#c1c6d7]/30">
                  <td className="p-6 text-sm" style={{ color: '#414754' }}>
                    Personal Account Manager
                  </td>
                  <td className="p-6 text-center text-xs" style={{ color: '#414754' }}>
                    —
                  </td>
                  <td className="p-6 text-center text-xs" style={{ color: '#414754' }}>
                    —
                  </td>
                  <td className="p-6 text-center">
                    <span className="material-symbols-outlined text-[#0058c3]">check</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold tracking-tight mb-4" style={{ color: '#191c1d' }}>
              Frequently Asked Questions
            </h3>
            <p style={{ color: '#414754' }}>Quick answers to common queries about Quickmation</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden transition-all duration-300"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(20px)',
                  borderTop: '1px solid rgba(255,255,255,0.4)',
                  borderLeft: '1px solid rgba(255,255,255,0.4)',
                  borderBottom: '1px solid rgba(0,0,0,0.05)',
                  borderRight: '1px solid rgba(0,0,0,0.05)',
                }}
              >
                <button
                  className="p-6 flex justify-between items-center cursor-pointer w-full text-left bg-transparent border-none"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold" style={{ color: '#191c1d' }}>
                    {faq.q}
                  </span>
                  <span
                    className="material-symbols-outlined text-[#0058c3] transition-transform"
                    style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    expand_more
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-sm leading-relaxed" style={{ color: '#414754' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Background Decor */}
      <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#0058c3]/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-400/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
    </WebsiteLayout>
  );
}
