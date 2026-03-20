import { Link } from 'react-router-dom';
import WebsiteLayout from './components/WebsiteLayout';

const teamMembers = [
  {
    name: 'Marcus Chen',
    role: 'Chief Architect',
    bio: 'Former lead at Hyperion. Marcus spent a decade rebuilding financial cores for the Fortune 50.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDw7c5wWQlLlC2WehxzJNvyYSqPA2XfQyP-r4QtdQq7npQBRk76aRfWD8kRMswFE7P9Bl5RR5NH6Fin3JEA6g04Znjwn0psAt40t6xoUjCZnlJ5Bscqt2InqNMETX5H09fRokTJmI73FBP3ICVzFQsSnEeZAqRtZ24IRDCemWGI2EoadDhFqz1a9dQeGcVDJqc1HQFsYB7yJPLNuz33MVIF18KdyqmtWZ7ihEKtqI6owMi3Eu-8iNPBmc3itl8HmPY42PZYBVWpNm4',
  },
  {
    name: 'Elena Rodriguez',
    role: 'Head of Product',
    bio: 'Passionate about human-centric interfaces for inhumanly complex data structures.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMZXb7M5truvlPVezrjFCfoXobTAk_Ohewf-eLF4nA0szd1VJbhV52RIjZ-lsbbc1jxQJXZhDxM9MPbAxpUzQpcyHV2_BPT9pReCLzdwfnzptIZj44y1w2jBMilI_F-7H5_n5Xxr7NCgmidNmp2Tl6786sisMsRpYv6xQ5iNK2o4_btWA9bIJsk1UV7kCKLkEKShEpUgoLtWGvyVitrNpUZ72g3ZSYhJStrjejlFYo0QfZpfsy4N4XuD1qMaJi5biEZX1jusV21-0',
  },
  {
    name: 'David Park',
    role: 'Lead Developer',
    bio: 'A systems engineer with a background in high-frequency trading infrastructure.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfihuy12DBFGvAgdWwn7QppjYpsiUtp9VLq9MU8YCYiLMlg106Q3JBxV8lntqowuQdHj2RhXzReJ0ifS6ZlhXxdEbLmPIqTPuj8h7TeE4zUqyeMpBxxY08Zh2ErDVDfCrnVHn5iFzRMsvp5R2VUyDNi0lLzpNk2uO29vAzk32NPalixtRvdua5BjzucMYD1lC8HgQuT9TpACgl0IxI0M6O4z5kKRnq8blVGiMusvO4ru-WiTy-XQoKiTNMtNTK5CFfXgEsaoLeCWg',
  },
  {
    name: 'Sarah Jenkins',
    role: 'Operations Lead',
    bio: 'Optimizing our internal engine to match the performance we deliver to our customers.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHiOG4hhRvdP8ByPNaI9kwbFyGa_nKeQLGnWlLgDAvRLcPyIEmpECgv0bMV1iIMMZPoYvH_W8AY_riOCisI1DKAhR2JA-ajTaUvFREDpnPH8JrSnHjRa2qPj7LNP97FT1zS_2BtICRJ5D06Z0JCM7v9VC6YIkmpolqGuUE7T_h7GI3Vb8QNL9-pdzWHOijoIlNXFhswns5tGVK1rTNTcXP92xUnKWXgCHF53l5Mso1_ZptL_1IVkiYFGpvRKr-DWP0GO6SsyFZHFo',
  },
];

export default function AboutPage() {
  return (
    <WebsiteLayout title="About">
      {/* Hero Section */}
      <section
        className="relative py-24 px-6"
        style={{
          background:
            'radial-gradient(circle at top right, rgba(0, 88, 195, 0.08), transparent 40%), radial-gradient(circle at bottom left, rgba(0, 112, 243, 0.05), transparent 40%)',
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0058c3] mb-4 block">
            Our Vision
          </span>
          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-8 max-w-4xl" style={{ color: '#191c1d' }}>
            Engineering the{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #0058c3 0%, #0070f3 100%)' }}
            >
              Automation Engine
            </span>{' '}
            for global scale.
          </h1>
          <p className="max-w-2xl leading-relaxed text-lg" style={{ color: '#414754' }}>
            We believe complex enterprise systems shouldn&apos;t feel like a black box. Our mission is
            to refract data through a clear lens, providing the precision of a high-performance engine
            with the clarity of glass.
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
      <section className="py-20 px-6" style={{ background: '#f3f4f5' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 p-10 rounded-xl shadow-sm border border-[#c1c6d7]/10" style={{ background: '#fff' }}>
              <span
                className="material-symbols-outlined text-[#0058c3] text-4xl mb-6"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                account_tree
              </span>
              <h2 className="text-3xl font-semibold tracking-tight mb-4" style={{ color: '#191c1d' }}>
                The Mission
              </h2>
              <p className="leading-relaxed text-lg" style={{ color: '#414754' }}>
                To decentralize enterprise operational power. By building an open, modular, and
                developer-first automation suite, we empower teams to build exactly what they need, not
                what a vendor forces upon them. We prioritize technical excellence over market fluff.
              </p>
            </div>
            <div className="md:col-span-5 bg-gradient-to-br from-[#0058c3] to-[#0070f3] p-10 rounded-xl flex flex-col justify-end text-white">
              <h3 className="text-2xl font-bold mb-2">100% Modularity</h3>
              <p className="opacity-80">
                Every module in Quickmation is an independent micro-service wrapped in a crystalline
                API.
              </p>
            </div>
            <div className="md:col-span-4 p-8 rounded-xl border border-[#c1c6d7]/10" style={{ background: '#fff' }}>
              <h4 className="font-bold mb-2" style={{ color: '#191c1d' }}>Transparency</h4>
              <p style={{ color: '#414754' }}>
                Real-time telemetry for every business logic process, visualized through our glass
                interface.
              </p>
            </div>
            <div className="md:col-span-4 p-8 rounded-xl border border-[#c1c6d7]/10" style={{ background: '#fff' }}>
              <h4 className="font-bold mb-2" style={{ color: '#191c1d' }}>Velocity</h4>
              <p style={{ color: '#414754' }}>
                Deploy mission-critical workflows in minutes, not months. The engine is built for speed.
              </p>
            </div>
            <div className="md:col-span-4 p-8 rounded-xl border border-[#c1c6d7]/10" style={{ background: '#fff' }}>
              <h4 className="font-bold mb-2" style={{ color: '#191c1d' }}>Integrity</h4>
              <p style={{ color: '#414754' }}>
                Immutable ledger systems ensure that your business data remains the single source of
                truth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div className="max-w-xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0058c3] mb-2 block">
                Our Architects
              </span>
              <h2 className="text-4xl font-bold tracking-tighter" style={{ color: '#191c1d' }}>
                Built by engineers, for engineers.
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="p-6 rounded-xl flex flex-col group"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(12px)',
                  borderTop: '1px solid rgba(255,255,255,0.4)',
                  borderLeft: '1px solid rgba(255,255,255,0.4)',
                  borderBottom: '1px solid rgba(0,0,0,0.05)',
                  borderRight: '1px solid rgba(0,0,0,0.05)',
                }}
              >
                <div className="aspect-square w-full rounded-lg mb-6 overflow-hidden relative" style={{ background: '#e1e3e4' }}>
                  <img
                    alt={member.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    src={member.img}
                  />
                  <div className="absolute inset-0 bg-[#0058c3]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 className="font-bold mb-1" style={{ color: '#191c1d' }}>{member.name}</h3>
                <p className="text-xs text-[#0058c3] mb-4 tracking-widest uppercase">{member.role}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#414754' }}>{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6" style={{ color: '#191c1d' }}>
            Ready to see the engine in action?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-[#0058c3] text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-[#0070f3] transition-colors no-underline"
            >
              Get Started Today
            </Link>
            <Link
              to="/features"
              className="px-8 py-3 rounded-lg font-bold hover:bg-[#e1e3e4] transition-colors no-underline"
              style={{ background: '#e7e8e9', color: '#191c1d' }}
            >
              View Features
            </Link>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
}
