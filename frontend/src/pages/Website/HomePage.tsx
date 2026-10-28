import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import WebsiteLayout from './components/WebsiteLayout';
import { canRenderHero3D, isCrawler } from '@/utils/graphicsCapabilities';

const HeroScene = lazy(() => import('@/components/HeroScene'));

const homeFaqs = [
  {
    q: 'What is ERP.js?',
    a: 'ERP.js is an open-source, full-stack enterprise resource planning and automation platform that unifies high-velocity CRM, visual low-code workflows, invoice management, inventory tracking, and real-time business intelligence into a single developer-first platform.',
  },
  {
    q: 'Is ERP.js genuinely free for enterprise use?',
    a: 'Yes. ERP.js is 100% open-source under the MIT license. There are no user limits, no tiered feature paywalls, and no recurring seat licenses. You get unrestricted access to the entire enterprise suite at zero cost.',
  },
  {
    q: 'How does ERP.js compare to traditional commercial ERP systems?',
    a: 'Traditional ERP software is slow, rigid, expensive, and difficult to customize. ERP.js provides a modern tech stack (React 18, TypeScript, Node.js, GraphQL, PostgreSQL), sub-second page loads, low-code automation, and direct code-level extensibility.',
  },
  {
    q: 'Can I self-host ERP.js on my own cloud infrastructure?',
    a: 'Yes. ERP.js can be deployed on any server or private cloud using Docker Compose, Helm charts on Kubernetes, or directly on AWS, Google Cloud, Azure, and bare-metal servers.',
  },
  {
    q: 'What APIs and integrations are supported?',
    a: 'ERP.js provides comprehensive REST and GraphQL APIs, real-time WebSockets, custom webhook triggers, and pre-built connectors for payment processors, email services, and messaging tools.',
  },
];

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://erp-js.vercel.app/#website',
      url: 'https://erp-js.vercel.app/',
      name: 'ERP.js',
      description: 'Open Source Enterprise Resource Planning and Automation Platform',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://erp-js.vercel.app/?s={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://erp-js.vercel.app/#software',
      name: 'ERP.js',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        'Sales CRM with Automated Lead Scoring',
        'Low-Code Drag-and-Drop Workflow Engine',
        'Real-Time Analytics and Executive Dashboards',
        'Invoicing, Quotes and Recurring Billing',
        'Role-Based Access Control and Security',
        'Full REST and GraphQL APIs',
      ],
      description:
        'ERP.js unifies CRM, workflows, invoicing, and analytics into a single high-performance canvas.',
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://erp-js.vercel.app/#faq',
      mainEntity: homeFaqs.map((faq) => ({
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

export default function HomePage() {
  const [isModelReady, setIsModelReady] = useState(false);
  const [allow3D, setAllow3D] = useState(false);
  const [crawlerClient, setCrawlerClient] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const crawlerDetected = isCrawler();
    setCrawlerClient(crawlerDetected);

    if (!crawlerDetected && canRenderHero3D()) {
      setAllow3D(true);
    }
  }, []);

  // When a search engine or LLM crawler visits, render an ultra-fast, text-first,
  // image-free semantic document designed for instant indexing and zero bandwidth waste.
  if (crawlerClient) {
    return (
      <WebsiteLayout
        title="Open Source ERP, CRM and Workflow Suite"
        description="ERP.js unifies your CRM, low-code workflows, inventory, billing, and real-time analytics into a single high-performance canvas. Built for developers, scaled for enterprise."
        canonicalPath="/"
        structuredData={structuredData}
      >
        <div className="max-w-5xl mx-auto px-6 py-12 font-sans">
          <header className="mb-12 border-b border-slate-200 pb-8">
            <h1 className="text-4xl font-heading font-extrabold text-slate-900 mb-4 tracking-tight">
              ERP.js: Open Source Enterprise Resource Planning, CRM, and Workflow Automation Suite
            </h1>
            <p className="text-lg text-slate-700 leading-relaxed">
              ERP.js unifies customer relationship management (CRM), event-driven low-code workflows,
              invoicing, accounting, inventory tracking, and real-time business intelligence into a
              unified platform. Built with React 18, TypeScript, Node.js, and GraphQL.
            </p>
          </header>

          {/* Quick Navigation Links for Crawlers */}
          <nav aria-label="Crawler Quick Navigation" className="mb-12 p-6 bg-white rounded-xl border border-slate-200">
            <h2 className="text-xl font-heading font-bold text-slate-900 mb-3">Site Navigation</h2>
            <ul className="grid grid-cols-2 sm:grid-cols-4 gap-4 list-none p-0">
              <li>
                <Link to="/features" className="text-blue-600 font-semibold hover:underline">
                  Platform Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-blue-600 font-semibold hover:underline">
                  Free Forever Pricing
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-blue-600 font-semibold hover:underline">
                  About ERP.js
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-blue-600 font-semibold hover:underline">
                  Contact and Support
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-blue-600 font-semibold hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-blue-600 font-semibold hover:underline">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/signup" className="text-blue-600 font-semibold hover:underline">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                  Sign In
                </Link>
              </li>
            </ul>
          </nav>

          {/* Core Modules Breakdown */}
          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold text-slate-900 mb-6">
              Core Enterprise Modules
            </h2>
            <div className="space-y-6">
              <article className="p-6 bg-white rounded-xl border border-slate-200">
                <h3 className="text-xl font-heading font-semibold text-slate-900 mb-2">
                  1. High-Velocity Sales CRM
                </h3>
                <p className="text-slate-700 leading-relaxed mb-3">
                  A high-performance pipeline manager engineered for deal velocity. Features automated
                  lead qualification, interactive Kanban boards, activity logs, contact relationship
                  timelines, and revenue forecasting.
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-1">
                  <li>Real-time pipeline synchronization across distributed teams</li>
                  <li>Automated lead scoring based on interaction history</li>
                  <li>Custom data schemas, deal stages, and account hierarchies</li>
                </ul>
              </article>

              <article className="p-6 bg-white rounded-xl border border-slate-200">
                <h3 className="text-xl font-heading font-semibold text-slate-900 mb-2">
                  2. Visual Low-Code Workflow Automation Engine
                </h3>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Automate repetitive operations with a node-based event-driven workflow engine.
                  Deploy automated pipelines triggered by internal data mutations, inbound webhooks,
                  or scheduled chronologies without writing boilerplate integration code.
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-1">
                  <li>Visual trigger-condition-action workflow canvas</li>
                  <li>Native integration with Slack, email, webhooks, and third-party APIs</li>
                  <li>Branching logic, rate-limiting, and automatic error retry policies</li>
                </ul>
              </article>

              <article className="p-6 bg-white rounded-xl border border-slate-200">
                <h3 className="text-xl font-heading font-semibold text-slate-900 mb-2">
                  3. Invoicing, Quotes, and Financial Operations
                </h3>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Comprehensive billing workflows from initial customer quote to finalized payment.
                  Includes tax calculation engines, automated PDF receipt generation, multi-currency
                  ledgers, and recurring subscription cycles.
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-1">
                  <li>Automated invoice generation and payment tracking</li>
                  <li>Multi-currency and localized tax compliance</li>
                  <li>Customer self-service quote acceptance portal</li>
                </ul>
              </article>

              <article className="p-6 bg-white rounded-xl border border-slate-200">
                <h3 className="text-xl font-heading font-semibold text-slate-900 mb-2">
                  4. Real-Time Analytics and Business Intelligence
                </h3>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Sub-second data visualization with zero query latency. Convert millions of operational
                  records into interactive charts, pipeline velocity metrics, and executive telemetry.
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-1">
                  <li>Pre-built dashboards for revenue, cash flow, and team productivity</li>
                  <li>Instant export to CSV, JSON, Excel, and automated scheduled digests</li>
                  <li>Custom metric aggregation with SQL and GraphQL data endpoints</li>
                </ul>
              </article>

              <article className="p-6 bg-white rounded-xl border border-slate-200">
                <h3 className="text-xl font-heading font-semibold text-slate-900 mb-2">
                  5. Enterprise Security, RBAC, and Audit Logging
                </h3>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Role-based access control, granular field-level permissions, and end-to-end audit
                  logs recording every user interaction and system modification.
                </p>
                <ul className="list-disc pl-6 text-slate-600 space-y-1">
                  <li>Granular role definitions: Admin, Manager, Contributor, Read-Only</li>
                  <li>Immutable audit logging for compliance and governance</li>
                  <li>Self-hosted data sovereignty with zero external telemetry lock-in</li>
                </ul>
              </article>
            </div>
          </section>

          {/* Technology Architecture Section */}
          <section className="mb-12 p-6 bg-white rounded-xl border border-slate-200">
            <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">
              Technical Architecture and Specifications
            </h2>
            <div className="grid md:grid-cols-2 gap-6 text-slate-700">
              <div>
                <h3 className="font-heading font-semibold text-slate-900 mb-2">Frontend Stack</h3>
                <p className="text-sm">
                  React 18 single-page application built on Vite and TypeScript. Styled using Tailwind CSS
                  and Plus Jakarta Sans typography. Apollo Client manages client-side GraphQL caching.
                </p>
              </div>
              <div>
                <h3 className="font-heading font-semibold text-slate-900 mb-2">Backend and API</h3>
                <p className="text-sm">
                  Node.js Express application offering RESTful endpoints and Apollo Server GraphQL. Real-time
                  socket channels power instant notification and collaboration sync.
                </p>
              </div>
              <div>
                <h3 className="font-heading font-semibold text-slate-900 mb-2">Data Persistence</h3>
                <p className="text-sm">
                  PostgreSQL and MongoDB persistence layers with strict transactional schema enforcement,
                  migrations, and Redis query caching.
                </p>
              </div>
              <div>
                <h3 className="font-heading font-semibold text-slate-900 mb-2">Deployment</h3>
                <p className="text-sm">
                  Containerized via Docker and Docker Compose. Ready for deployment on Kubernetes, AWS ECS,
                  Google Cloud Run, Azure, Render, or on-premise hardware.
                </p>
              </div>
            </div>
          </section>

          {/* Frequently Asked Questions */}
          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold text-slate-900 mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {homeFaqs.map((faq, index) => (
                <div key={index} className="p-6 bg-white rounded-xl border border-slate-200">
                  <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-slate-700 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Comparison Table */}
          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold text-slate-900 mb-6">
              ERP.js Compared with Legacy Enterprise Solutions
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-200 bg-white">
                <thead>
                  <tr className="bg-slate-100 text-slate-900">
                    <th className="p-4 border border-slate-200 font-heading font-bold">Feature</th>
                    <th className="p-4 border border-slate-200 font-heading font-bold text-blue-600">ERP.js</th>
                    <th className="p-4 border border-slate-200 font-heading font-bold">Legacy Commercial ERP</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  <tr>
                    <td className="p-4 border border-slate-200 font-medium">Pricing Model</td>
                    <td className="p-4 border border-slate-200 font-semibold text-green-700">$0 Free Forever</td>
                    <td className="p-4 border border-slate-200">$100 to $500 per seat per month</td>
                  </tr>
                  <tr>
                    <td className="p-4 border border-slate-200 font-medium">Source Code Access</td>
                    <td className="p-4 border border-slate-200 font-semibold text-green-700">100% Open Source (MIT)</td>
                    <td className="p-4 border border-slate-200">Proprietary closed source</td>
                  </tr>
                  <tr>
                    <td className="p-4 border border-slate-200 font-medium">Hosting Flexibility</td>
                    <td className="p-4 border border-slate-200 font-semibold text-green-700">Self-host or any cloud provider</td>
                    <td className="p-4 border border-slate-200">Vendor cloud lock-in</td>
                  </tr>
                  <tr>
                    <td className="p-4 border border-slate-200 font-medium">Modern API Architecture</td>
                    <td className="p-4 border border-slate-200 font-semibold text-green-700">REST, GraphQL and WebSockets</td>
                    <td className="p-4 border border-slate-200">Legacy SOAP, XML, or restricted APIs</td>
                  </tr>
                  <tr>
                    <td className="p-4 border border-slate-200 font-medium">Workflow Automation</td>
                    <td className="p-4 border border-slate-200 font-semibold text-green-700">Visual low-code engine included</td>
                    <td className="p-4 border border-slate-200">Expensive third-party add-on</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Footer Call to Action */}
          <section className="p-8 bg-slate-900 text-white rounded-xl text-center">
            <h2 className="text-2xl font-heading font-bold mb-4">Start Using ERP.js Today</h2>
            <p className="text-slate-300 max-w-xl mx-auto mb-6">
              Experience the power of a modern open-source automation suite with no upfront fees.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/signup"
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 no-underline"
              >
                Create Free Account
              </Link>
              <Link
                to="/contact"
                className="px-6 py-3 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-700 border border-slate-700 no-underline"
              >
                Contact Engineering
              </Link>
            </div>
          </section>
        </div>
      </WebsiteLayout>
    );
  }

  // Regular Visitor View: High visual appeal with modern typography, Bento grids, and crisp layout
  return (
    <WebsiteLayout
      title="Open Source ERP, CRM and Workflow Suite"
      description="ERP.js unifies your CRM, workflows, and analytics into a single high-performance canvas. Built for developers, scaled for enterprise."
      canonicalPath="/"
      structuredData={structuredData}
    >
      {/* Hero Section */}
      <section
        className="relative min-h-[85vh] flex items-center overflow-hidden"
        style={{ background: '#f8f9fa' }}
      >
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-[#0058c3]/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#a6c1fe]/20 rounded-full blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left side hero content */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8e2ff] text-[#004397] text-[11px] font-bold uppercase tracking-widest mb-6">
              <span className="flex h-2 w-2 rounded-full bg-[#0058c3]"></span>
              Open Source Enterprise Suite
            </div>
            <h1
              className="font-heading text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6"
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
            <p className="font-sans text-lg md:text-xl leading-relaxed mb-8 max-w-xl text-slate-600">
              ERP.js unifies your CRM, low-code workflows, invoicing, and real-time analytics into a
              single high-performance canvas. Built for developers, scaled for enterprise.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/signup"
                className="px-8 py-4 bg-gradient-to-br from-[#0058c3] to-[#0070f3] text-white rounded-xl font-heading font-semibold text-lg shadow-xl hover:shadow-[#0058c3]/20 transition-all hover:-translate-y-0.5 active:scale-95 no-underline"
              >
                Get Started Free
              </Link>
              <Link
                to="/contact"
                className="px-8 py-4 rounded-xl font-heading font-semibold text-lg hover:bg-[#e7e8e9] transition-all active:scale-95 no-underline border border-slate-300"
                style={{ color: '#191c1d' }}
              >
                Book Demo
              </Link>
            </div>
          </div>

          {/* Right side hero visual */}
          <div className="relative hidden lg:flex justify-center items-center h-[560px] rounded-2xl overflow-hidden">
            <img
              src="/hero-section-3d-model-static-removebg-preview.webp"
              alt="ERP.js Automation Engine Canvas"
              aria-hidden={allow3D && isModelReady ? 'true' : undefined}
              // @ts-expect-error fetchpriority attribute
              fetchpriority="high"
              loading="eager"
              decoding="sync"
              width={468}
              height={468}
              className="w-[82%] h-[82%] absolute pointer-events-none transition-opacity duration-700 object-contain"
              style={{ opacity: allow3D && isModelReady ? 0 : 1 }}
            />
            {allow3D && (
              <div
                className="absolute inset-0 transition-opacity duration-700"
                style={{ opacity: isModelReady ? 1 : 0 }}
              >
                <Suspense fallback={null}>
                  <HeroScene onReady={() => setIsModelReady(true)} />
                </Suspense>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section
        className="py-12 border-y border-[#c1c6d7]/20 overflow-hidden"
        style={{ background: '#f3f4f5' }}
      >
        <div className="container mx-auto px-6">
          <p
            className="text-center text-[11px] font-bold uppercase tracking-widest mb-8 text-slate-500"
          >
            Engineered for high-growth engineering and operations teams
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60">
            {['Stripe', 'Vercel', 'Linear', 'Framer', 'Retool'].map((name) => (
              <span key={name} className="font-heading text-xl font-bold tracking-tight text-slate-600">
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
            <div className="inline-block px-3 py-1 rounded-full bg-[#d8e2ff] text-[#004397] text-xs font-bold uppercase tracking-wider mb-4">
              All-In-One Suite
            </div>
            <h2
              className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4 text-slate-900"
            >
              One Engine. Total <span className="text-[#0058c3]">Clarity</span>.
            </h2>
            <p className="max-w-2xl mx-auto text-slate-600 text-lg leading-relaxed">
              Eliminate software fragmentation with an integrated system built on a fast, modern
              developer architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* CRM Card */}
            <div
              className="md:col-span-8 rounded-2xl p-8 flex flex-col justify-between overflow-hidden relative group bg-white shadow-sm border border-slate-200/80"
            >
              <div className="relative z-10">
                <span className="material-symbols-outlined text-[#0058c3] mb-4 text-3xl">
                  contacts
                </span>
                <h3 className="font-heading text-2xl font-bold mb-2 text-slate-900">High-Velocity CRM</h3>
                <p className="max-w-md mb-6 text-slate-600">
                  Manage pipeline complexity with an interface designed for speed, automated lead
                  scoring, and real-time team synchronization.
                </p>
              </div>
              <div
                className="mt-auto h-48 rounded-xl border border-slate-200 p-4 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-500 overflow-hidden bg-slate-100"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-3/4 bg-white/70 rounded"></div>
                  <div className="h-4 w-1/2 bg-white/70 rounded"></div>
                  <div className="h-4 w-5/6 bg-white/70 rounded"></div>
                </div>
              </div>
            </div>

            {/* AI Assistant */}
            <div className="md:col-span-4 bg-[#0058c3] p-8 rounded-2xl flex flex-col text-white group overflow-hidden relative shadow-sm">
              <span className="material-symbols-outlined mb-4 text-3xl">psychology</span>
              <h3 className="font-heading text-2xl font-bold mb-2">Predictive AI Copilot</h3>
              <p className="text-[#d8e2ff] leading-relaxed mb-6">
                Automate routine decision-making with built-in intelligence that learns from your
                operations and prioritizes tasks.
              </p>
              <Link
                to="/features"
                className="mt-auto flex items-center gap-2 font-heading font-semibold text-sm text-white no-underline"
              >
                Explore Platform Capabilities{' '}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            {/* Workflow Automation */}
            <div
              className="md:col-span-4 rounded-2xl p-8 flex flex-col bg-white shadow-sm border border-slate-200/80"
            >
              <span className="material-symbols-outlined text-[#0058c3] mb-4 text-3xl">
                account_tree
              </span>
              <h3 className="font-heading text-xl font-bold mb-2 text-slate-900">Event Workflows</h3>
              <p className="text-sm mb-6 text-slate-600">
                Low-code automation for high-impact operations. Connect webhooks, notifications, and
                data mutations with ease.
              </p>
              <div className="flex flex-col gap-2 opacity-75">
                <div className="flex items-center gap-3 p-2.5 rounded bg-slate-100">
                  <span className="material-symbols-outlined text-sm text-green-600">check_circle</span>
                  <span className="text-xs font-medium text-slate-700">When Invoice Marked Paid</span>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded translate-x-4 bg-slate-100">
                  <span className="material-symbols-outlined text-sm text-blue-600">bolt</span>
                  <span className="text-xs font-medium text-slate-700">Send Customer Fulfillment Alert</span>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div
              className="md:col-span-8 rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-center bg-white shadow-sm border border-slate-200/80"
            >
              <div className="flex-1">
                <span className="material-symbols-outlined text-[#0058c3] mb-4 text-3xl">
                  analytics
                </span>
                <h3 className="font-heading text-2xl font-bold mb-2 text-slate-900">Zero-Latency Analytics</h3>
                <p className="text-slate-600 leading-relaxed">
                  Real-time business intelligence across leads, invoices, and workflows. Turn operational
                  data into executive dashboards without waiting for batch queries.
                </p>
              </div>
              <div className="flex-1 w-full h-full min-h-[160px] bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-end justify-around gap-2">
                <div className="w-5 bg-[#0058c3]/20 h-[35%] rounded-t"></div>
                <div className="w-5 bg-[#0058c3]/40 h-[60%] rounded-t"></div>
                <div className="w-5 bg-[#0058c3] h-[85%] rounded-t"></div>
                <div className="w-5 bg-[#0058c3]/30 h-[50%] rounded-t"></div>
                <div className="w-5 bg-[#0058c3]/60 h-[72%] rounded-t"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 px-6 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Why Teams Choose ERP.js
            </h2>
            <p className="text-slate-600 text-lg">
              A transparent comparison between ERP.js and legacy enterprise suites.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-900 font-heading">
                  <th className="p-4 font-bold">Capability</th>
                  <th className="p-4 font-bold text-blue-600">ERP.js</th>
                  <th className="p-4 font-bold text-slate-500">Commercial ERPs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-sans text-sm">
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Total License Cost</td>
                  <td className="p-4 text-green-600 font-semibold">$0 Free Forever</td>
                  <td className="p-4 text-slate-500">$100 to $500 per seat per month</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">User Seats</td>
                  <td className="p-4 text-green-600 font-semibold">Unlimited</td>
                  <td className="p-4 text-slate-500">Tiered per user</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Hosting Options</td>
                  <td className="p-4 text-green-600 font-semibold">Self-host (Docker / Cloud / Bare-metal)</td>
                  <td className="p-4 text-slate-500">Vendor cloud lock-in</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Modern Developer Stack</td>
                  <td className="p-4 text-green-600 font-semibold">React 18, TypeScript, GraphQL, Node</td>
                  <td className="p-4 text-slate-500">Legacy proprietary frameworks</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Workflow Automation</td>
                  <td className="p-4 text-green-600 font-semibold">Included out of the box</td>
                  <td className="p-4 text-slate-500">Costly add-on module</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-20 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600">
              Clear answers to common questions about ERP.js architecture, licensing, and deployment.
            </p>
          </div>

          <div className="space-y-4">
            {homeFaqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all shadow-sm"
                >
                  <button
                    className="w-full text-left p-6 font-heading font-semibold text-lg text-slate-900 flex justify-between items-center cursor-pointer border-none bg-transparent"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <span className="material-symbols-outlined text-slate-400">
                      {isOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-slate-600 leading-relaxed font-sans text-sm border-t border-slate-100 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-6 bg-white border-t border-slate-200">
        <div className="container mx-auto max-w-5xl">
          <div
            className="rounded-[2rem] p-12 md:p-20 text-center relative overflow-hidden"
            style={{ background: '#191c1d' }}
          >
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#0058c3] rounded-full blur-[100px]"></div>
              <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#a6c1fe] rounded-full blur-[100px]"></div>
            </div>
            <h2
              className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight mb-6 relative z-10 text-white"
            >
              Ready to rebuild your operations?
            </h2>
            <p
              className="max-w-xl mx-auto mb-10 text-lg relative z-10 text-slate-300 font-sans leading-relaxed"
            >
              Join teams running their entire operation on ERP.js. Scale your workflows without
              recurring license debt.
            </p>
            <div className="flex flex-wrap justify-center gap-4 relative z-10">
              <Link
                to="/signup"
                className="px-10 py-4 bg-[#0058c3] text-white rounded-xl font-heading font-bold hover:bg-[#0070f3] transition-all shadow-xl no-underline"
              >
                Deploy Now
              </Link>
              <Link
                to="/contact"
                className="px-10 py-4 bg-white/10 text-white backdrop-blur-md rounded-xl font-heading font-bold hover:bg-white/20 transition-all border border-white/20 no-underline"
              >
                Talk to Engineering
              </Link>
            </div>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
}
