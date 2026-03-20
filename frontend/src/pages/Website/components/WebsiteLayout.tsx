import { Helmet } from 'react-helmet-async';
import WebsiteFooter from './WebsiteFooter';
import WebsiteNavbar from './WebsiteNavbar';

interface WebsiteLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function WebsiteLayout({ children, title }: WebsiteLayoutProps) {
  return (
    <>
      <Helmet>
        <title>{title ? `${title} | Quickmation` : 'Quickmation | Automation Suite'}</title>
      </Helmet>
      <div
        className="min-h-screen font-inter antialiased"
        style={{
          fontFamily: "'Inter', sans-serif",
          background: '#f8f9fa',
          color: '#191c1d',
        }}
      >
        <WebsiteNavbar />
        <main className="pt-14">{children}</main>
        <WebsiteFooter />
      </div>
    </>
  );
}
