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

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <WebsiteLayout
      title="Contact Us"
      description="Connect with the ERP.js engineering team. Whether you're scaling a startup or re-architecting an enterprise, we're ready to help you integrate."
      canonicalPath="/contact"
    >
      <div className="pt-10 pb-20 px-6 max-w-7xl mx-auto font-inter">
        {/* Hero Header */}
        <header className="mb-16 text-center md:text-left">
          <h1
            className="text-5xl font-bold tracking-tight mb-4 leading-tight"
            style={{ color: '#191c1d' }}
          >
            Connect with our <span className="text-[#0058c3]">Engineering</span> Team
          </h1>
          <p className="max-w-2xl leading-relaxed" style={{ color: '#414754' }}>
            Whether you&apos;re scaling a startup or re-architecting an enterprise, our team is
            ready to help you integrate the automation engine into your workflow.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Section 1: Contact Form */}
          <section className="lg:col-span-7">
            <div
              className="p-8 rounded-xl shadow-sm"
              style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(12px)',
                borderTop: '1px solid rgba(255,255,255,0.4)',
                borderLeft: '1px solid rgba(255,255,255,0.4)',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                borderRight: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <h2 className="text-xl font-semibold mb-8" style={{ color: '#191c1d' }}>
                Send a Message
              </h2>
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <input
                      className="w-full rounded-lg px-4 pt-6 pb-2 placeholder-transparent text-sm outline-none transition-all"
                      style={{
                        background: '#e1e3e4',
                        color: '#191c1d',
                        border: '1.5px solid transparent',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '1.5px solid #0058c3';
                        e.target.style.boxShadow =
                          'inset 0 2px 4px rgba(0,0,0,0.06), 0 0 0 3px rgba(0,88,195,0.12)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '1.5px solid transparent';
                        e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.06)';
                      }}
                      id="name"
                      name="name"
                      placeholder="Name"
                      type="text"
                    />
                    <label
                      className="absolute left-4 top-2 text-[10px] font-medium"
                      style={{ color: '#414754' }}
                      htmlFor="name"
                    >
                      Name
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      className="w-full rounded-lg px-4 pt-6 pb-2 placeholder-transparent text-sm outline-none transition-all"
                      style={{
                        background: '#e1e3e4',
                        color: '#191c1d',
                        border: '1.5px solid transparent',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '1.5px solid #0058c3';
                        e.target.style.boxShadow =
                          'inset 0 2px 4px rgba(0,0,0,0.06), 0 0 0 3px rgba(0,88,195,0.12)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '1.5px solid transparent';
                        e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.06)';
                      }}
                      id="email"
                      name="email"
                      placeholder="Work Email"
                      type="email"
                    />
                    <label
                      className="absolute left-4 top-2 text-[10px] font-medium"
                      style={{ color: '#414754' }}
                      htmlFor="email"
                    >
                      Work Email
                    </label>
                  </div>
                </div>
                <div className="relative">
                  <input
                    className="w-full rounded-lg px-4 pt-6 pb-2 placeholder-transparent text-sm outline-none transition-all"
                    style={{
                      background: '#e1e3e4',
                      color: '#191c1d',
                      border: '1.5px solid transparent',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '1.5px solid #0058c3';
                      e.target.style.boxShadow =
                        'inset 0 2px 4px rgba(0,0,0,0.06), 0 0 0 3px rgba(0,88,195,0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '1.5px solid transparent';
                      e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.06)';
                    }}
                    id="company"
                    name="company"
                    placeholder="Company"
                    type="text"
                  />
                  <label
                    className="absolute left-4 top-2 text-[10px] font-medium"
                    style={{ color: '#414754' }}
                    htmlFor="company"
                  >
                    Company
                  </label>
                </div>
                <div className="relative">
                  <textarea
                    className="w-full rounded-lg px-4 pt-6 pb-2 placeholder-transparent resize-none text-sm outline-none transition-all"
                    style={{
                      background: '#e1e3e4',
                      color: '#191c1d',
                      border: '1.5px solid transparent',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '1.5px solid #0058c3';
                      e.target.style.boxShadow =
                        'inset 0 2px 4px rgba(0,0,0,0.06), 0 0 0 3px rgba(0,88,195,0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '1.5px solid transparent';
                      e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.06)';
                    }}
                    id="message"
                    name="message"
                    placeholder="Message"
                    rows={5}
                  ></textarea>
                  <label
                    className="absolute left-4 top-2 text-[10px] font-medium"
                    style={{ color: '#414754' }}
                    htmlFor="message"
                  >
                    Message
                  </label>
                </div>
                <button
                  className="w-full bg-gradient-to-br from-[#0058c3] to-[#0070f3] text-white py-4 rounded-lg font-semibold tracking-wide hover:shadow-lg transition-all active:scale-[0.98] border-none cursor-pointer text-base"
                  type="submit"
                >
                  Send Message
                </button>
              </form>
            </div>
          </section>

          {/* Sidebar Context */}
          <div className="lg:col-span-5 space-y-12">
            {/* Office Locations */}
            <section>
              <h3
                className="text-xs font-semibold mb-6 uppercase tracking-wider flex items-center gap-2"
                style={{ color: '#414754' }}
              >
                <span className="material-symbols-outlined text-[#0058c3] text-sm">public</span>
                Global Hubs
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {[
                  {
                    city: 'San Francisco',
                    address: 'Market Street, Suite 400',
                    icon: 'apartment',
                    color: '#d8e2ff',
                    iconColor: '#0058c3',
                  },
                  {
                    city: 'London',
                    address: 'Shoreditch Tech Hub',
                    icon: 'corporate_fare',
                    color: '#a6c1fe',
                    iconColor: '#435d94',
                  },
                  {
                    city: 'Tokyo',
                    address: 'Minato City Tower',
                    icon: 'location_city',
                    color: '#ffdbcd',
                    iconColor: '#a23d00',
                  },
                ].map((office) => (
                  <div
                    key={office.city}
                    className="p-5 rounded-lg flex items-center gap-4 group hover:bg-white transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.7)',
                      backdropFilter: 'blur(12px)',
                      borderTop: '1px solid rgba(255,255,255,0.4)',
                      borderLeft: '1px solid rgba(255,255,255,0.4)',
                      borderBottom: '1px solid rgba(0,0,0,0.05)',
                      borderRight: '1px solid rgba(0,0,0,0.05)',
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded flex items-center justify-center"
                      style={{ background: office.color, color: office.iconColor }}
                    >
                      <span className="material-symbols-outlined">{office.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-bold" style={{ color: '#191c1d' }}>
                        {office.city}
                      </h4>
                      <p className="text-xs" style={{ color: '#414754' }}>
                        {office.address}
                      </p>
                    </div>
                    <span
                      className="material-symbols-outlined ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: '#c1c6d7' }}
                    >
                      north_east
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Support Card */}
            <div className="bg-[#0058c3]/5 rounded-xl p-8 border border-[#0058c3]/10 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-bold mb-2" style={{ color: '#191c1d' }}>
                  Priority Support?
                </h3>
                <p className="text-sm mb-6" style={{ color: '#414754' }}>
                  Enterprise customers get a dedicated Slack channel and 1-hour SLA response times.
                </p>
                <Link
                  to="/pricing"
                  className="text-[#0058c3] font-bold flex items-center gap-2 group no-underline"
                >
                  Learn more about Enterprise
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </Link>
              </div>
              <span
                className="material-symbols-outlined absolute -right-4 -bottom-4 text-[#0058c3]/10 rotate-12"
                style={{ fontSize: '120px' }}
              >
                support_agent
              </span>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <section className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-10 text-center" style={{ color: '#191c1d' }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {contactFaqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden group"
                style={{ background: '#f3f4f5' }}
              >
                <button
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-[#edeeef] transition-colors bg-transparent border-none cursor-pointer"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold" style={{ color: '#191c1d' }}>
                    {faq.q}
                  </span>
                  <span
                    className="material-symbols-outlined transition-colors"
                    style={{ color: openFaq === i ? '#0058c3' : '#414754' }}
                  >
                    {openFaq === i ? 'remove' : 'add'}
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 leading-relaxed text-sm" style={{ color: '#414754' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Decorative Elements */}
      <div className="fixed top-0 right-0 -z-10 w-1/3 h-1/2 bg-gradient-to-bl from-[#0058c3]/5 to-transparent blur-3xl opacity-50"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-1/4 h-1/3 bg-gradient-to-tr from-[#435d94]/5 to-transparent blur-3xl opacity-50"></div>
    </WebsiteLayout>
  );
}
