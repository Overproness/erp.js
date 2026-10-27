import { useState } from 'react';
import { Link } from 'react-router-dom';
import WebsiteLayout from './components/WebsiteLayout';

const contactFaqs = [
  {
    q: 'How long does integration typically take?',
    a: 'Most technical teams achieve a basic integration within 48 hours. Enterprise-wide deployments typically range from 2 to 4 weeks depending on data complexity.',
  },
  {
    q: 'Do you offer on-premise hosting?',
    a: 'Yes, our Private Cloud tier allows for full orchestration within your VPC (AWS, GCP, or Azure) or on bare-metal hardware.',
  },
  {
    q: 'What kind of developer support do you provide?',
    a: 'Every account includes access to our community Discord. Professional and Enterprise tiers include direct engineering support from our core contributors.',
  },
];

const contactStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ContactPage',
      '@id': 'https://yourdomain.com/contact#webpage',
      url: 'https://yourdomain.com/contact',
      name: 'Contact Engineering | ERP.js Enterprise Automation Suite',
      description:
        'Connect with the ERP.js engineering team for technical inquiries, integration support, and enterprise deployments.',
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
            name: 'Contact',
            item: 'https://yourdomain.com/contact',
          },
        ],
      },
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://yourdomain.com/contact#faq',
      mainEntity: contactFaqs.map((faq) => ({
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

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <WebsiteLayout
      title="Contact Engineering and Enterprise Support"
      description="Connect with the ERP.js engineering team for technical inquiries, integration support, and enterprise self-hosting assistance."
      canonicalPath="/contact"
      keywords="contact ERP.js, enterprise ERP support, open source ERP contact, ERP integration assistance"
      structuredData={contactStructuredData}
    >
      <div className="pt-10 pb-20 px-6 max-w-7xl mx-auto font-sans">
        {/* Hero Header */}
        <header className="mb-16 text-center md:text-left">
          <h1
            className="font-heading text-5xl font-extrabold tracking-tight mb-4 leading-tight text-slate-900"
          >
            Connect with our <span className="text-[#0058c3]">Engineering</span> Team
          </h1>
          <p className="max-w-2xl leading-relaxed text-slate-600 text-lg">
            Whether you are scaling a fast-moving startup or re-architecting an enterprise stack,
            our team is ready to help you integrate the automation engine into your workflow.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Section 1: Contact Form */}
          <section className="lg:col-span-7">
            <div
              className="p-8 rounded-xl shadow-sm border border-slate-200/80 bg-white"
            >
              <h2 className="font-heading text-2xl font-bold mb-8 text-slate-900">
                Send a Message
              </h2>
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <input
                      className="w-full rounded-lg px-4 pt-6 pb-2 placeholder-transparent text-sm outline-none transition-all font-sans bg-slate-100 border border-transparent focus:border-[#0058c3] focus:bg-white"
                      id="name"
                      name="name"
                      placeholder="Name"
                      type="text"
                    />
                    <label
                      className="absolute left-4 top-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
                      htmlFor="name"
                    >
                      Name
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      className="w-full rounded-lg px-4 pt-6 pb-2 placeholder-transparent text-sm outline-none transition-all font-sans bg-slate-100 border border-transparent focus:border-[#0058c3] focus:bg-white"
                      id="email"
                      name="email"
                      placeholder="Email"
                      type="email"
                    />
                    <label
                      className="absolute left-4 top-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
                      htmlFor="email"
                    >
                      Email
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <input
                    className="w-full rounded-lg px-4 pt-6 pb-2 placeholder-transparent text-sm outline-none transition-all font-sans bg-slate-100 border border-transparent focus:border-[#0058c3] focus:bg-white"
                    id="subject"
                    name="subject"
                    placeholder="Subject"
                    type="text"
                  />
                  <label
                    className="absolute left-4 top-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
                    htmlFor="subject"
                  >
                    Subject
                  </label>
                </div>

                <div className="relative">
                  <textarea
                    className="w-full rounded-lg px-4 pt-6 pb-2 placeholder-transparent text-sm outline-none transition-all font-sans bg-slate-100 border border-transparent focus:border-[#0058c3] focus:bg-white resize-y"
                    id="message"
                    name="message"
                    placeholder="Message"
                    rows={5}
                  ></textarea>
                  <label
                    className="absolute left-4 top-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
                    htmlFor="message"
                  >
                    Message
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#0058c3] text-white rounded-lg font-heading font-bold hover:bg-[#0070f3] transition-all shadow-md active:scale-[0.99] border-none cursor-pointer text-base"
                >
                  Send Message
                </button>
              </form>
            </div>
          </section>

          {/* Section 2: Direct Contact Details */}
          <section className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-xl shadow-sm border border-slate-200/80 bg-white">
              <h2 className="font-heading text-2xl font-bold mb-6 text-slate-900">
                Direct Channels
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0058c3] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">mail</span>
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-slate-900 text-sm">Email Support</h3>
                    <p className="text-slate-600 text-sm">support@erpjs.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0058c3] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">forum</span>
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-slate-900 text-sm">Community Forum</h3>
                    <p className="text-slate-600 text-sm">community.erpjs.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0058c3] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">code</span>
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-slate-900 text-sm">GitHub Repository</h3>
                    <p className="text-slate-600 text-sm">github.com/ERPjs/ERPjs_project</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-xl bg-gradient-to-br from-blue-50 to-slate-100 border border-blue-100">
              <h3 className="font-heading text-xl font-bold mb-2 text-slate-900">Enterprise SLA</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Deploying mission-critical infrastructure? Our contributor team provides architecture reviews
                and dedicated response channels.
              </p>
              <Link
                to="/pricing"
                className="font-heading font-semibold text-sm text-[#0058c3] flex items-center gap-1.5 no-underline hover:underline"
              >
                Learn More About Enterprise Access
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </section>
        </div>

        {/* FAQs */}
        <section className="mt-24 max-w-4xl mx-auto">
          <h2 className="font-heading text-3xl font-bold mb-10 text-center text-slate-900">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {contactFaqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden bg-white border border-slate-200/80 shadow-sm transition-all"
              >
                <button
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors bg-transparent border-none cursor-pointer"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-heading font-semibold text-slate-900 text-base">
                    {faq.q}
                  </span>
                  <span
                    className="material-symbols-outlined transition-colors text-slate-500"
                  >
                    {openFaq === i ? 'remove' : 'add'}
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 leading-relaxed text-sm text-slate-600 border-t border-slate-100 pt-4 font-sans">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </WebsiteLayout>
  );
}
