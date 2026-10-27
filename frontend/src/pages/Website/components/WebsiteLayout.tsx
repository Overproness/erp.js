import { Helmet } from 'react-helmet-async';
import WebsiteFooter from './WebsiteFooter';
import WebsiteNavbar from './WebsiteNavbar';

interface WebsiteLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalPath?: string;
  structuredData?: Record<string, any> | Array<Record<string, any>>;
}

const BASE_URL = (import.meta as any).env?.VITE_APP_URL || 'https://yourdomain.com';

const DEFAULT_DESCRIPTION =
  'ERP.js unifies your CRM, workflows, and analytics into a single high-performance platform. Built for developers, scaled for enterprise.';

const DEFAULT_KEYWORDS =
  'open source ERP, CRM software, workflow automation, business process automation, enterprise software, open source CRM, billing software, inventory management, low code automation';

export default function WebsiteLayout({
  children,
  title,
  description,
  keywords,
  ogImage,
  canonicalPath,
  structuredData,
}: WebsiteLayoutProps) {
  const pageTitle = title ? `${title} | ERP.js` : 'ERP.js | Open Source ERP, CRM and Workflow Suite';
  const pageDescription = description || DEFAULT_DESCRIPTION;
  const pageKeywords = keywords || DEFAULT_KEYWORDS;
  const ogImageUrl = `${BASE_URL}${ogImage || '/logo-bg-remove.png'}`;
  const canonicalUrl = canonicalPath ? `${BASE_URL}${canonicalPath}` : undefined;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="title" content={pageTitle} />
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={pageKeywords} />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

        {/* Open Graph / Social Media */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ERP.js" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:locale" content="en_US" />
        {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImageUrl} />

        {/* Canonical URL */}
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

        {/* Dynamic Structured Data */}
        {structuredData && (
          <script type="application/ld+json">
            {JSON.stringify(structuredData)}
          </script>
        )}
      </Helmet>
      <div
        className="min-h-screen font-sans antialiased text-[#191c1d] bg-[#f8f9fa] selection:bg-[#0058c3] selection:text-white"
        style={{
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        }}
      >
        <WebsiteNavbar />
        <main className="pt-16">{children}</main>
        <WebsiteFooter />
      </div>
    </>
  );
}
