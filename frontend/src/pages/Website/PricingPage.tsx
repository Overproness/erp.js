import { useState } from 'react';
import { Link } from 'react-router-dom';
import WebsiteLayout from './components/WebsiteLayout';

const faqs = [
  {
    q: 'Is ERP.js really 100% free?',
    a: 'Yes! Every user and organization receives our highest-tier Enterprise plan completely free forever. There are no subscription fees, no hidden costs, and no credit card required to get started.',
  },
  {
    q: 'Why did you make everything free?',
    a: 'We believe modern businesses should not be held back by prohibitive enterprise software licensing fees. By making the full CRM, finance, AI, and workflow automation engine open and free, teams of any size can operate and scale without technical debt.',
  },
  {
    q: 'How does the n8n workflow integration work?',
    a: 'Our internal visual workflow builder, trigger rules, and business process automation engine are built directly into the platform and completely free for everyone with unlimited workflows. For external n8n container integration, each instance runs in an isolated Docker container requiring dedicated cluster compute resources. Because compute is limited, n8n instances are allocated to organizations on-demand based on server availability.',
  },
  {
    q: 'How can I request dedicated n8n compute access?',
    a: 'You can request compute allocation directly from your workspace dashboard or the subscription settings tab. As soon as server cluster compute capacity is available, a dedicated n8n container instance will be provisioned for your workspace.',
  },
  {
    q: 'Are there any hidden limits on users, contacts, or invoices?',
    a: 'None! Everyone receives unlimited users, unlimited contacts, unlimited invoices, full document management, and complete AI capabilities.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. ERP.js utilizes enterprise-grade encryption for all data at rest and in transit, complete with GDPR compliance tools, audit trails, and role-based access control.',
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
        starter: 'Unlimited',
        pro: 'Unlimited',
        enterprise: 'Unlimited',
      },
      { feature: 'Trigger Rules', starter: true, pro: true, enterprise: true },
      { feature: 'Business Process Engine', starter: true, pro: true, enterprise: true },
      { feature: 'Workflow Execution Tracking', starter: true, pro: true, enterprise: true },
      {
        feature: 'n8n Visual Workflow Builder',
        starter: false,
        pro: false,
        enterprise: 'On Request (Compute Limited)',
      },
      { feature: 'Automation Suggestions (AI)', starter: false, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Artificial Intelligence',
    rows: [
      { feature: 'AI Assistant', starter: 'Standard', pro: 'Advanced', enterprise: 'Advanced' },
      { feature: 'AI Copilot', starter: true, pro: true, enterprise: true },
      { feature: 'AI Content Generation', starter: true, pro: true, enterprise: true },
      { feature: 'AI Text Summarization', starter: true, pro: true, enterprise: true },
      { feature: 'AI Translation', starter: true, pro: true, enterprise: true },
      { feature: 'AI Document Tagging', starter: true, pro: true, enterprise: true },
      { feature: 'OCR & Data Extraction', starter: true, pro: true, enterprise: true },
      { feature: 'AI Sentiment Analysis', starter: true, pro: true, enterprise: true },
      { feature: 'Predictive Analytics', starter: true, pro: true, enterprise: true },
      { feature: 'AI Knowledge Base', starter: false, pro: true, enterprise: true },
      { feature: 'AI Anomaly Detection', starter: false, pro: true, enterprise: true },
      {
        feature: 'Multi-Provider AI (OpenAI, Claude, Gemini)',
        starter: false,
        pro: true,
        enterprise: true,
      },
      { feature: 'Self-Learning Engine', starter: false, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Marketing & Campaigns',
    rows: [
      { feature: 'Campaign Management', starter: true, pro: true, enterprise: true },
      { feature: 'Campaign Analytics', starter: true, pro: true, enterprise: true },
      { feature: 'Email Campaigns', starter: true, pro: true, enterprise: true },
      { feature: 'A/B Testing', starter: true, pro: true, enterprise: true },
      { feature: 'Retargeting Engine', starter: true, pro: true, enterprise: true },
      { feature: 'Behavior Tracking', starter: 'Advanced', pro: 'Advanced', enterprise: 'Advanced' },
      { feature: 'Customer Behavior Analytics', starter: true, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Social Media & Reputation',
    rows: [
      {
        feature: 'Social Account Management',
        starter: 'Unlimited',
        pro: 'Unlimited',
        enterprise: 'Unlimited',
      },
      { feature: 'Social Post Scheduling', starter: true, pro: true, enterprise: true },
      { feature: 'Social Campaign Management', starter: true, pro: true, enterprise: true },
      { feature: 'Social Analytics', starter: true, pro: true, enterprise: true },
      { feature: 'Social Mention Monitoring', starter: true, pro: true, enterprise: true },
      { feature: 'Review Aggregation', starter: true, pro: true, enterprise: true },
      { feature: 'Review Response Automation', starter: true, pro: true, enterprise: true },
      { feature: 'Review Analytics & Sentiment', starter: true, pro: true, enterprise: true },
      { feature: 'Public Reputation Portal', starter: true, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Analytics & Reporting',
    rows: [
      { feature: 'Dashboard Statistics', starter: true, pro: true, enterprise: true },
      { feature: 'Module-Level Stats', starter: true, pro: true, enterprise: true },
      { feature: 'Revenue Analytics', starter: 'Advanced', pro: 'Advanced', enterprise: 'Advanced' },
      { feature: 'Global KPI Dashboard', starter: true, pro: true, enterprise: true },
      { feature: 'Real-time Analytics', starter: true, pro: true, enterprise: true },
      { feature: 'URL Click Analytics', starter: true, pro: true, enterprise: true },
      { feature: 'Analytics Data Export', starter: true, pro: true, enterprise: true },
      { feature: 'Cross-Module Comparison', starter: true, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Communication',
    rows: [
      { feature: 'In-App Notifications', starter: true, pro: true, enterprise: true },
      { feature: 'Internal Team Chat', starter: true, pro: true, enterprise: true },
      { feature: 'Email Notifications', starter: true, pro: true, enterprise: true },
      { feature: 'Customer Live Chat', starter: true, pro: true, enterprise: true },
      { feature: 'SMS Notifications', starter: true, pro: true, enterprise: true },
      { feature: 'Push Notifications', starter: true, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Surveys & Feedback',
    rows: [
      { feature: 'Survey Builder', starter: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
      { feature: 'Public Survey Links', starter: true, pro: true, enterprise: true },
      { feature: 'Survey Analytics', starter: 'Advanced', pro: 'Advanced', enterprise: 'Advanced' },
    ],
  },
  {
    category: 'Compliance & Security',
    rows: [
      { feature: 'Basic Audit Trail', starter: true, pro: true, enterprise: true },
      {
        feature: 'Advanced Audit (per-entity, search)',
        starter: true,
        pro: true,
        enterprise: true,
      },
      { feature: 'Consent Management (GDPR)', starter: true, pro: true, enterprise: true },
      { feature: 'Data Retention Policies', starter: true, pro: true, enterprise: true },
      { feature: 'GDPR Data Export / Deletion', starter: true, pro: true, enterprise: true },
      { feature: 'Compliance Reporting', starter: true, pro: true, enterprise: true },
      { feature: 'SSO / SAML', starter: true, pro: true, enterprise: true },
      { feature: 'Custom Branding (White-label)', starter: true, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Support & API',
    rows: [
      { feature: 'Community & Email Support', starter: 'Standard', pro: 'Priority', enterprise: 'Priority' },
      { feature: 'Knowledge Base Access', starter: true, pro: true, enterprise: true },
      { feature: 'Onboarding Assistance', starter: true, pro: true, enterprise: true },
      { feature: 'API Access', starter: 'Full', pro: 'Full', enterprise: 'Full + Webhooks' },
    ],
  },
];

function CellContent({ value }: { value: CellValue }) {
  if (value === true)
    return <span className="material-symbols-outlined text-[#0058c3]">check</span>;
  if (value === false)
    return (
      <span className="text-xs" style={{ color: '#414754' }}>
        -
      </span>
    );
  return <span className="text-sm font-medium">{value}</span>;
}

const pricingStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': 'https://yourdomain.com/pricing#webpage',
      url: 'https://yourdomain.com/pricing',
      name: 'Pricing: 100% Free Forever Enterprise Suite | ERP.js',
      description:
        'ERP.js is 100% free with all highest-tier Enterprise features included. No subscriptions, no credit card required.',
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
            name: 'Pricing',
            item: 'https://yourdomain.com/pricing',
          },
        ],
      },
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://yourdomain.com/pricing#faq',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.a,
        },
      })),
    },
  ],
};

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <WebsiteLayout
      title="Pricing: 100% Free Forever Enterprise Suite"
      description="ERP.js is 100% free with all highest-tier Enterprise features included. No subscriptions, no credit card required."
      canonicalPath="/pricing"
      keywords="free ERP, open source ERP pricing, enterprise suite pricing, free CRM, free workflow automation"
      structuredData={pricingStructuredData}
    >
      <div className="pt-20 pb-24 px-6 max-w-7xl mx-auto font-sans">
        {/* Hero Header */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#0058c3] bg-[#d8e2ff] mb-6">
            <span className="material-symbols-outlined text-sm">celebration</span>
            100% Free Forever
          </div>
          <h1
            className="font-heading text-5xl md:text-6xl font-extrabold tracking-tight mb-6"
            style={{ color: '#191c1d' }}
          >
            Everything is Free. <br />
            Enterprise Power for Everyone.
          </h1>
          <p className="max-w-2xl mx-auto text-lg mb-8 text-slate-600">
            We have eliminated software licensing fees. Everyone receives full access to our highest-tier
            Enterprise plan at <strong>$0/month</strong> with unlimited users, full AI Copilot, marketing automation,
            and real-time analytics. No credit card required.
          </p>

          <div
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full text-sm font-semibold"
            style={{ background: '#f3f4f5', color: '#191c1d', border: '1px solid #e1e3e4' }}
          >
            <span className="material-symbols-outlined text-green-600">verified</span>
            <span>All Features Unlocked · $0 Forever · No Subscriptions</span>
          </div>
        </header>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-16">
          {/* Starter Plan */}
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
                  $0
                </span>
                <span className="text-sm font-semibold text-green-600">
                  / free forever
                </span>
              </div>
              <p className="mt-2 text-sm" style={{ color: '#414754' }}>
                For small teams and freelancers replacing spreadsheets.
              </p>
            </div>
            <ul className="space-y-3.5 mb-10 flex-grow list-none p-0">
              {[
                'Unlimited team members',
                'Full CRM & contact management',
                'Invoicing, quoting & payments',
                'Task & project management',
                'Document management & versioning',
                'Native workflow rules & triggers',
                'Dashboard & module statistics',
                'Community & email support',
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
            <p className="text-center text-xs mb-3 text-green-600 font-medium">
              Free Forever · No credit card required
            </p>
            <Link
              to="/signup?plan=starter"
              className="w-full text-center py-3 rounded-md font-semibold transition-colors no-underline block border border-[#c1c6d7]"
              style={{ color: '#191c1d', background: '#ffffff' }}
            >
              Get Started Free
            </Link>
          </div>

          {/* Professional Plan */}
          <div
            className="p-8 rounded-xl flex flex-col transition-all hover:-translate-y-1 duration-300"
            style={glassCard}
          >
            <div className="mb-8">
              <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.05em] text-[#0058c3] bg-[#d8e2ff] px-2 py-1 rounded">
                Professional
              </span>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight" style={{ color: '#191c1d' }}>
                  $0
                </span>
                <span className="text-sm font-semibold text-green-600">
                  / free forever
                </span>
              </div>
              <p className="mt-2 text-sm" style={{ color: '#414754' }}>
                For growing teams that need AI, marketing & advanced automation.
              </p>
            </div>
            <ul className="space-y-3.5 mb-10 flex-grow list-none p-0">
              {[
                'Unlimited team members',
                'Everything in Starter, plus:',
                'AI Assistant & Copilot',
                'AI content generation & summarization',
                'Campaign management & A/B testing',
                'Social media management & analytics',
                'Native workflow engine & triggers',
                'Advanced analytics & real-time KPI',
                'Customer live chat & SMS',
                'E-signatures & OCR data extraction',
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
            <p className="text-center text-xs mb-3 text-green-600 font-medium">
              Free Forever · No credit card required
            </p>
            <Link
              to="/signup?plan=professional"
              className="w-full text-center py-3 rounded-md font-semibold transition-colors no-underline block border border-[#c1c6d7]"
              style={{ color: '#191c1d', background: '#ffffff' }}
            >
              Get Started Free
            </Link>
          </div>

          {/* Enterprise Plan (Default / Highlighted) */}
          <div
            className="p-8 rounded-xl flex flex-col relative border-2 border-[#0058c3]/40 z-10 transition-all hover:-translate-y-1 duration-300 md:scale-105"
            style={{
              boxShadow: '0 20px 40px rgba(25, 28, 29, 0.08), 0 0 40px rgba(0, 88, 195, 0.15)',
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div
              className="absolute -top-4 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full"
              style={{ background: 'linear-gradient(135deg, #0058c3, #0070f3)' }}
            >
              Default Plan For Everyone
            </div>
            <div className="mb-8">
              <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.05em] text-[#722ed1] bg-[#f9f0ff] px-2 py-1 rounded">
                Enterprise
              </span>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight" style={{ color: '#191c1d' }}>
                  $0
                </span>
                <span className="text-sm font-semibold text-green-600">
                  / free forever
                </span>
              </div>
              <p className="mt-2 text-sm" style={{ color: '#414754' }}>
                Complete crystalline control with unlimited users, all AI engines & full compliance.
              </p>
            </div>
            <ul className="space-y-3.5 mb-10 flex-grow list-none p-0">
              {[
                'Unlimited team members',
                'Everything in Professional, plus:',
                'n8n visual workflow builder (compute allocated on request)',
                'Advanced AI with self-learning engine',
                'Multi-provider AI (OpenAI, Claude, Gemini)',
                'AI Knowledge Base & anomaly detection',
                'Full reputation management suite',
                'GDPR compliance & data retention',
                'SSO / SAML & custom branding',
                'Full API & webhooks access',
              ].map((item, i) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm font-medium"
                  style={{ color: '#191c1d' }}
                >
                  <span className="material-symbols-outlined text-[#0058c3] text-lg">
                    {i === 1 ? 'arrow_forward' : 'verified'}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-center text-xs mb-3 text-green-600 font-bold">
              Included For Everyone · Free Forever
            </p>
            <Link
              to="/signup?plan=enterprise"
              className="w-full text-center font-bold py-3 rounded-md shadow-lg shadow-[#0058c3]/20 hover:opacity-90 transition-all active:scale-95 no-underline block text-white"
              style={{ background: 'linear-gradient(135deg, #0058c3, #0070f3)' }}
            >
              Get Enterprise Free
            </Link>
          </div>
        </div>

        {/* Compute Resource Notice Banner */}
        <div
          className="mb-24 p-8 rounded-2xl border border-[#0058c3]/20 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 88, 195, 0.05) 0%, rgba(0, 112, 243, 0.08) 100%)',
          }}
        >
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-[#0058c3] bg-[#d8e2ff] mb-3">
                <span className="material-symbols-outlined text-sm">cloud_sync</span>
                N8N Workflow Compute Policy
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#191c1d' }}>
                Dedicated n8n Workflow Integration & Compute Availability
              </h3>
              <p className="text-sm leading-relaxed mb-0" style={{ color: '#414754' }}>
                All core ERP modules, native visual workflow builder tools, and AI features are 100% free and unlimited.
                Because external n8n pipelines run in isolated, multi-tenant container instances that consume heavy server compute resources,
                n8n container provisioning is granted on-demand based on cluster compute capacity. You can submit a compute allocation request
                from your workspace dashboard at any time.
              </p>
            </div>
            <Link
              to="/signup?plan=enterprise"
              className="px-6 py-3 rounded-lg font-semibold text-sm text-white no-underline transition-all hover:opacity-90 flex-shrink-0"
              style={{ background: '#0058c3' }}
            >
              Deploy Free Workspace
            </Link>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl font-bold tracking-tight mb-4" style={{ color: '#191c1d' }}>
              Compare Every Feature
            </h2>
            <p style={{ color: '#414754' }}>
              Every single tier is free ($0/mo), with all enterprise capabilities unlocked for all accounts.
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
                    Starter ($0)
                  </th>
                  <th className="p-5 text-[0.6875rem] font-semibold uppercase tracking-[0.05em] text-center w-[22%]"
                    style={{ color: '#414754' }}
                  >
                    Professional ($0)
                  </th>
                  <th
                    className="p-5 text-[0.6875rem] font-semibold uppercase tracking-[0.05em] text-center w-[22%] text-[#0058c3]"
                  >
                    Enterprise ($0 · Included)
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((section) => (
                  <tbody key={`section-${section.category}`}>
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
                  </tbody>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl font-bold tracking-tight mb-4" style={{ color: '#191c1d' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ color: '#414754' }}>Quick answers regarding our 100% free model and compute allocation</p>
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
