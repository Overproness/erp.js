import { Helmet } from 'react-helmet-async';
import WebsiteFooter from './WebsiteFooter';
import WebsiteNavbar from './WebsiteNavbar';

interface WebsiteLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  ogImage?: string;
  canonicalPath?: string;
}

const BASE_URL = (import.meta as any).env?.VITE_APP_URL || 'https://yourdomain.com';

const DEFAULT_DESCRIPTION =
  'ERP.js unifies your CRM, workflows, and analytics into a single high-performance platform. Built for developers, scaled for enterprise.';

export default function WebsiteLayout({
  children,
  title,
  description,
  ogImage,
  canonicalPath,
}: WebsiteLayoutProps) {
  const pageTitle = title ? `${title} | ERP.js` : 'ERP.js | Automation Suite';
  const pageDescription = description || DEFAULT_DESCRIPTION;
  const ogImageUrl = `${BASE_URL}${ogImage || '/og-image.png'}`;
  const canonicalUrl = canonicalPath ? `${BASE_URL}${canonicalPath}` : undefined;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />

        {/* Open Graph / Social Media */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={ogImageUrl} />
        {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImageUrl} />

        {/* Canonical URL */}
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
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
        <main className="pt-16">{children}</main>
        <WebsiteFooter />
      </div>
    </>
  );
}
