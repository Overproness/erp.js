import { useState } from 'react';
import { Link } from 'react-router-dom';
import WebsiteLayout from './components/WebsiteLayout';

const faqs = [
  {
    q: 'Is there a free trial?',
    a: 'Yes — every plan includes a 14-day free trial with full access to all features in that tier. No credit card required to start. At the end of your trial you choose a plan or your data is safely archived for 30 days.',
  },
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
    a: 'ERP.js uses military-grade encryption for all data at rest and in transit. We are SOC2 Type II compliant and offer advanced security features like SSO and audit logs on our higher-tier plans.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and wire transfers for annual Enterprise plans. All payments are processed securely through Stripe.',
  },
];

/* ─── Glass card style (DESIGN.md: Glassmorphic Cards) ─── */
const glassCard = {
  background: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(20px)',
  borderTop: '1px solid rgba(255,255,255,0.4)',
  borderLeft: '1px solid rgba(255,255,255,0.4)',
  borderBottom: '1px solid rgba(0,0,0,0.05)',
  borderRight: '1px solid rgba(0,0,0,0.05)',
};

/* ─── Feature Comparison Data ─── */
type CellValue = true | false | string;

interface FeatureRow {
  feature: string;
  starter: CellValue;
  pro: CellValue;
  enterprise: CellValue;
}

interface FeatureSection {
  category: string;
  rows: FeatureRow[];
}

const comparisonData: FeatureSection[] = [
  {
    category: 'CRM & Sales',
    rows: [
      { feature: 'Contact Management', starter: true, pro: true, enterprise: true },
      { feature: 'Client Search & Filtering', starter: true, pro: true, enterprise: true },
      { feature: 'Bulk Import / Export', starter: true, pro: true, enterprise: true },
      { feature: 'Appointments & Scheduling', starter: true, pro: true, enterprise: true },
      { feature: 'Lead Scoring (AI)', starter: false, pro: true, enterprise: true },
      { feature: 'Customer Segmentation', starter: false, pro: true, enterprise: true },
      { feature: 'Customer Journey Tracking', starter: false, pro: true, enterprise: true },
      { feature: 'Follow-up Automation', starter: false, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Finance & Billing',
    rows: [
      { feature: 'Invoicing & Quoting', starter: true, pro: true, enterprise: true },
      { feature: 'Payments & Payment Modes', starter: true, pro: true, enterprise: true },
      { feature: 'Tax Management', starter: true, pro: true, enterprise: true },
      { feature: 'Quote-to-Invoice Conversion', starter: true, pro: true, enterprise: true },
      { feature: 'PDF Generation & Download', starter: true, pro: true, enterprise: true },
      { feature: 'Bulk Email Quotes', starter: false, pro: true, enterprise: true },
      { feature: 'Recurring Billing', starter: false, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Operations & Productivity',
    rows: [
      { feature: 'Task Management', starter: true, pro: true, enterprise: true },
      { feature: 'Project Management', starter: true, pro: true, enterprise: true },
      { feature: 'Document Management', starter: true, pro: true, enterprise: true },
      { feature: 'Document Versioning', starter: true, pro: true, enterprise: true },
      { feature: 'Document Sharing & Links', starter: true, pro: true, enterprise: true },
      { feature: 'Automated Reminders', starter: true, pro: true, enterprise: true },
      { feature: 'E-Signatures', starter: false, pro: true, enterprise: true },
      { feature: 'AI Task Prioritization', starter: false, pro: true, enterprise: true },
      { feature: 'Document Compliance & Audit', starter: false, pro: false, enterprise: true },
    ],
  },
  {
    category: 'Workflow Automation',
    rows: [
      {
        feature: 'Automated Rules',
        starter: 'Up to 10',
        pro: 'Unlimited',
        enterprise: 'Unlimited',
      },
      { feature: 'Trigger Rules', starter: false, pro: true, enterprise: true },
      { feature: 'Business Process Engine', starter: false, pro: true, enterprise: true },
      { feature: 'Workflow Execution Tracking', starter: true, pro: true, enterprise: true },
      { feature: 'n8n Visual Workflow Builder', starter: false, pro: false, enterprise: true },
      { feature: 'Automation Suggestions (AI)', starter: false, pro: false, enterprise: true },
    ],
  },
  {
    category: 'Artificial Intelligence',
    rows: [
      { feature: 'AI Assistant', starter: false, pro: 'Standard', enterprise: 'Advanced' },
      { feature: 'AI Copilot', starter: false, pro: true, enterprise: true },
      { feature: 'AI Content Generation', starter: false, pro: true, enterprise: true },
      { feature: 'AI Text Summarization', starter: false, pro: true, enterprise: true },
      { feature: 'AI Translation', starter: false, pro: true, enterprise: true },
      { feature: 'AI Document Tagging', starter: false, pro: true, enterprise: true },
      { feature: 'OCR & Data Extraction', starter: false, pro: true, enterprise: true },
      { feature: 'AI Sentiment Analysis', starter: false, pro: true, enterprise: true },
      { feature: 'Predictive Analytics', starter: false, pro: true, enterprise: true },
      { feature: 'AI Knowledge Base', starter: false, pro: false, enterprise: true },
      { feature: 'AI Anomaly Detection', starter: false, pro: false, enterprise: true },
      {
        feature: 'Multi-Provider AI (OpenAI, Claude, Gemini)',
        starter: false,
        pro: false,
        enterprise: true,
      },
      { feature: 'Self-Learning Engine', starter: false, pro: false, enterprise: true },
    ],
  },
  {
    category: 'Marketing & Campaigns',
    rows: [
      { feature: 'Campaign Management', starter: false, pro: true, enterprise: true },
      { feature: 'Campaign Analytics', starter: false, pro: true, enterprise: true },
      { feature: 'Email Campaigns', starter: false, pro: true, enterprise: true },
      { feature: 'A/B Testing', starter: false, pro: true, enterprise: true },
      { feature: 'Retargeting Engine', starter: false, pro: true, enterprise: true },
      { feature: 'Behavior Tracking', starter: 'Basic', pro: 'Advanced', enterprise: 'Advanced' },
      { feature: 'Customer Behavior Analytics', starter: false, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Social Media & Reputation',
    rows: [
      {
        feature: 'Social Account Management',
        starter: false,
        pro: 'Up to 5',
        enterprise: 'Unlimited',
      },
      { feature: 'Social Post Scheduling', starter: false, pro: true, enterprise: true },
      { feature: 'Social Campaign Management', starter: false, pro: true, enterprise: true },
      { feature: 'Social Analytics', starter: false, pro: true, enterprise: true },
      { feature: 'Social Mention Monitoring', starter: false, pro: false, enterprise: true },
      { feature: 'Review Aggregation', starter: false, pro: false, enterprise: true },
      { feature: 'Review Response Automation', starter: false, pro: false, enterprise: true },
      { feature: 'Review Analytics & Sentiment', starter: false, pro: false, enterprise: true },
      { feature: 'Public Reputation Portal', starter: false, pro: false, enterprise: true },
    ],
  },
  {
    category: 'Analytics & Reporting',
    rows: [
      { feature: 'Dashboard Statistics', starter: true, pro: true, enterprise: true },
      { feature: 'Module-Level Stats', starter: true, pro: true, enterprise: true },
      { feature: 'Revenue Analytics', starter: 'Basic', pro: 'Advanced', enterprise: 'Advanced' },
      { feature: 'Global KPI Dashboard', starter: false, pro: true, enterprise: true },
      { feature: 'Real-time Analytics', starter: false, pro: true, enterprise: true },
      { feature: 'URL Click Analytics', starter: true, pro: true, enterprise: true },
      { feature: 'Analytics Data Export', starter: false, pro: false, enterprise: true },
      { feature: 'Cross-Module Comparison', starter: false, pro: false, enterprise: true },
    ],
  },
  {
    category: 'Communication',
    rows: [
      { feature: 'In-App Notifications', starter: true, pro: true, enterprise: true },
      { feature: 'Internal Team Chat', starter: true, pro: true, enterprise: true },
      { feature: 'Email Notifications', starter: true, pro: true, enterprise: true },
      { feature: 'Customer Live Chat', starter: false, pro: true, enterprise: true },
      { feature: 'SMS Notifications', starter: false, pro: true, enterprise: true },
      { feature: 'Push Notifications', starter: false, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Surveys & Feedback',
    rows: [
      { feature: 'Survey Builder', starter: 'Up to 3', pro: 'Unlimited', enterprise: 'Unlimited' },
      { feature: 'Public Survey Links', starter: true, pro: true, enterprise: true },
      { feature: 'Survey Analytics', starter: 'Basic', pro: 'Advanced', enterprise: 'Advanced' },
    ],
  },
  {
    category: 'Compliance & Security',
    rows: [
      { feature: 'Basic Audit Trail', starter: true, pro: true, enterprise: true },
      {
        feature: 'Advanced Audit (per-entity, search)',
        starter: false,
        pro: true,
        enterprise: true,
      },
      { feature: 'Consent Management (GDPR)', starter: false, pro: false, enterprise: true },
      { feature: 'Data Retention Policies', starter: false, pro: false, enterprise: true },
      { feature: 'GDPR Data Export / Deletion', starter: false, pro: false, enterprise: true },
      { feature: 'Compliance Reporting', starter: false, pro: false, enterprise: true },
      { feature: 'SSO / SAML', starter: false, pro: false, enterprise: true },
      { feature: 'Custom Branding (White-label)', starter: false, pro: false, enterprise: true },
    ],
  },
  {
    category: 'Support & API',
    rows: [
      { feature: 'Email Support', starter: '48h', pro: '12h', enterprise: '1h SLA' },
      { feature: 'Knowledge Base Access', starter: true, pro: true, enterprise: true },
      { feature: 'Onboarding Assistance', starter: false, pro: true, enterprise: true },
      { feature: 'Personal Account Manager', starter: false, pro: false, enterprise: true },
      { feature: 'Custom Training Sessions', starter: false, pro: false, enterprise: true },
      { feature: 'API Access', starter: 'Read-only', pro: 'Full', enterprise: 'Full + Webhooks' },
    ],
  },
];

function CellContent({ value }: { value: CellValue }) {
  if (value === true)
    return <span className="material-symbols-outlined text-[#0058c3]">check</span>;
  if (value === false)
    return (
      <span className="text-xs" style={{ color: '#414754' }}>
        —
      </span>
    );
  return <span className="text-sm">{value}</span>;
}

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  const starterPrice = billing === 'annual' ? 39 : 49;
  const proPrice = billing === 'annual' ? 119 : 149;
  const enterprisePrice = billing === 'annual' ? 319 : 399;

  return (
    <WebsiteLayout
      title="Pricing"
      description="ERP.js pricing plans for every scale. From startup to enterprise — transparent pricing that grows with your business."
      canonicalPath="/pricing"
    >
      <div className="pt-20 pb-24 px-6 max-w-7xl mx-auto font-inter">
        {/* Hero Header */}
        <header className="text-center mb-16">
          <h1
            className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-6"
            style={{ color: '#191c1d' }}
          >
            Pricing that scales <br />
            with your growth.
          </h1>
          <p className="max-w-2xl mx-auto text-lg mb-8" style={{ color: '#414754' }}>
            The Crystalline Engine powers enterprises of all sizes. Choose the layer that fits your
            operational needs. Every plan starts with a 14-day free trial.
          </p>

          {/* Billing Toggle */}
          <div
            className="inline-flex items-center gap-3 p-1 rounded-lg"
            style={{ background: '#f3f4f5' }}
          >
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all border-none cursor-pointer ${
                billing === 'monthly' ? 'bg-white text-[#191c1d]' : 'bg-transparent'
              }`}
              style={billing !== 'monthly' ? { color: '#414754' } : {}}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all border-none cursor-pointer ${
                billing === 'annual' ? 'bg-white text-[#191c1d]' : 'bg-transparent'
              }`}
              style={billing !== 'annual' ? { color: '#414754' } : {}}
            >
              Annual
              <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-[#0058c3]">
                Save 20%
              </span>
            </button>
          </div>
        </header>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-32">
          {/* Starter Tier */}
          <div
            className="p-8 rounded-xl flex flex-col transition-all hover:-translate-y-1 duration-300"
            style={glassCard}
          >
            <div className="mb-8">
              <span
                className="text-[0.6875rem] font-semibold uppercase tracking-[0.05em] px-2 py-1 rounded"
                style={{ color: '#414754', background: '#e7e8e9' }}
              >
                Starter
              </span>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight" style={{ color: '#191c1d' }}>
                  ${starterPrice}
                </span>
                <span className="text-sm" style={{ color: '#414754' }}>
                  /mo {billing === 'annual' && '(billed annually)'}
                </span>
              </div>
              <p className="mt-2 text-sm" style={{ color: '#414754' }}>
                For small teams and freelancers replacing spreadsheets.
              </p>
            </div>
            <ul className="space-y-3.5 mb-10 flex-grow list-none p-0">
              {[
                'Up to 10 users',
                'Full CRM & contact management',
                'Invoicing, quoting & payments',
                'Task & project management',
                'Document management & versioning',
                'Basic workflows (up to 10 rules)',
                'Dashboard & module statistics',
                'Email support (48h)',
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm"
                  style={{ color: '#191c1d' }}
                >
                  <span className="material-symbols-outlined text-[#0058c3] text-lg">
                    check_circle
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-center text-xs mb-3" style={{ color: '#414754' }}>
              14-day free trial · No credit card required
            </p>
            <Link
              to="/signup?plan=starter"
              className="w-full text-center py-3 rounded-md font-semibold transition-colors no-underline block"
              style={{ background: '#e1e3e4', color: '#191c1d' }}
            >
              Start Free Trial
            </Link>
          </div>

          {/* Professional Tier (Highlighted) */}
          <div
            className="p-8 rounded-xl flex flex-col relative border-2 border-[#0058c3]/20 z-10 transition-all hover:-translate-y-1 duration-300 md:scale-105"
            style={{
              boxShadow: '0 20px 40px rgba(25, 28, 29, 0.06), 0 0 40px rgba(0, 88, 195, 0.12)',
              background: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div
              className="absolute -top-4 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full"
              style={{ background: 'linear-gradient(135deg, #0058c3, #0070f3)' }}
            >
              Most Popular
            </div>
            <div className="mb-8">
              <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.05em] text-[#0058c3] bg-[#d8e2ff] px-2 py-1 rounded">
                Professional
              </span>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight" style={{ color: '#191c1d' }}>
                  ${proPrice}
                </span>
                <span className="text-sm" style={{ color: '#414754' }}>
                  /mo {billing === 'annual' && '(billed annually)'}
                </span>
              </div>
              <p className="mt-2 text-sm" style={{ color: '#414754' }}>
                For growing teams that need AI, marketing & advanced automation.
              </p>
            </div>
            <ul className="space-y-3.5 mb-10 flex-grow list-none p-0">
              {[
                'Up to 50 users',
                'Everything in Starter, plus:',
                'AI Assistant & Copilot',
                'AI content generation & summarization',
                'Campaign management & A/B testing',
                'Social media management (5 accounts)',
                'Unlimited workflows & triggers',
                'Advanced analytics & real-time KPI',
                'Customer live chat & SMS',
                'E-signatures & OCR',
                'Priority email support (12h)',
              ].map((item, i) => (
                <li
                  key={item}
                  className={`flex items-center gap-3 text-sm font-medium`}
                  style={{ color: '#191c1d' }}
                >
                  <span
                    className="material-symbols-outlined text-[#0058c3] text-lg"
                    style={i > 0 ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {i === 1 ? 'arrow_forward' : i >= 2 ? 'auto_awesome' : 'check_circle'}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-center text-xs mb-3" style={{ color: '#414754' }}>
              14-day free trial · No credit card required
            </p>
            <Link
              to="/signup?plan=professional"
              className="w-full text-center font-bold py-3 rounded-md shadow-lg shadow-[#0058c3]/20 hover:opacity-90 transition-all active:scale-95 no-underline block text-white"
              style={{ background: 'linear-gradient(135deg, #0058c3, #0070f3)' }}
            >
              Start Free Trial
            </Link>
          </div>

          {/* Enterprise Tier */}
          <div
            className="p-8 rounded-xl flex flex-col transition-all hover:-translate-y-1 duration-300"
            style={glassCard}
          >
            <div className="mb-8">
              <span
                className="text-[0.6875rem] font-semibold uppercase tracking-[0.05em] px-2 py-1 rounded"
                style={{ color: '#414754', background: '#e7e8e9' }}
              >
                Enterprise
              </span>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight" style={{ color: '#191c1d' }}>
                  ${enterprisePrice}
                </span>
                <span className="text-sm" style={{ color: '#414754' }}>
                  /mo {billing === 'annual' && '(billed annually)'}
                </span>
              </div>
              <p className="mt-2 text-sm" style={{ color: '#414754' }}>
                For large organizations needing compliance, custom workflows & full AI.
              </p>
            </div>
            <ul className="space-y-3.5 mb-10 flex-grow list-none p-0">
              {[
                'Unlimited users',
                'Everything in Professional, plus:',
                'n8n visual workflow builder (400+ integrations)',
                'Advanced AI with self-learning engine',
                'Multi-provider AI (OpenAI, Claude, Gemini)',
                'AI Knowledge Base & anomaly detection',
                'Full reputation management suite',
                'GDPR compliance & data retention',
                'SSO / SAML & custom branding',
                'Dedicated account manager',
                '1h SLA support',
              ].map((item, i) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm"
                  style={{ color: '#191c1d' }}
                >
                  <span className="material-symbols-outlined text-[#0058c3] text-lg">
                    {i === 1 ? 'arrow_forward' : 'verified'}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-center text-xs mb-3" style={{ color: '#414754' }}>
              14-day free trial · No credit card required
            </p>
            <Link
              to="/signup?plan=enterprise"
              className="w-full text-center py-3 rounded-md font-semibold transition-colors no-underline block"
              style={{ background: '#e1e3e4', color: '#191c1d' }}
            >
              Start Free Trial
            </Link>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold tracking-tight mb-4" style={{ color: '#191c1d' }}>
              Compare Every Feature
            </h3>
            <p style={{ color: '#414754' }}>
              A complete breakdown across all tiers. Find exactly what fits your operational goals.
            </p>
          </div>
          <div className="rounded-xl overflow-hidden overflow-x-auto" style={glassCard}>
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr style={{ background: '#f3f4f5' }}>
                  <th
                    className="p-5 text-[0.6875rem] font-semibold uppercase tracking-[0.05em] text-left w-[34%]"
                    style={{ color: '#414754' }}
                  >
                    Feature
                  </th>
                  <th
                    className="p-5 text-[0.6875rem] font-semibold uppercase tracking-[0.05em] text-center w-[22%]"
                    style={{ color: '#414754' }}
                  >
                    Starter
                  </th>
                  <th className="p-5 text-[0.6875rem] font-semibold uppercase tracking-[0.05em] text-center w-[22%] text-[#0058c3]">
                    Professional
                  </th>
                  <th
                    className="p-5 text-[0.6875rem] font-semibold uppercase tracking-[0.05em] text-center w-[22%]"
                    style={{ color: '#414754' }}
                  >
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((section) => (
                  <>
                    <tr key={`cat-${section.category}`}>
                      <td
                        colSpan={4}
                        className="px-5 py-4 text-sm font-bold"
                        style={{ color: '#191c1d', background: 'rgba(255,255,255,0.5)' }}
                      >
                        {section.category}
                      </td>
                    </tr>
                    {section.rows.map((row) => (
                      <tr
                        key={row.feature}
                        className="border-t border-[#c1c6d7]/15 transition-colors"
                        style={{ background: 'transparent' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f5')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td className="px-5 py-[0.6rem] text-sm" style={{ color: '#414754' }}>
                          {row.feature}
                        </td>
                        <td className="px-5 py-[0.6rem] text-center">
                          <CellContent value={row.starter} />
                        </td>
                        <td className="px-5 py-[0.6rem] text-center">
                          <CellContent value={row.pro} />
                        </td>
                        <td className="px-5 py-[0.6rem] text-center">
                          <CellContent value={row.enterprise} />
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
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
            <p style={{ color: '#414754' }}>Quick answers to common queries about ERP.js</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden transition-all duration-300"
                style={glassCard}
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
