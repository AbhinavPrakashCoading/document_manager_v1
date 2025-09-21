import 'styles/tailwind.css';
import type { Metadata } from 'next';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'DocKit - Rythmiq',
  description: 'Autonomous Document Intelligence Platform - Streamline document processing with AI-powered validation, smart schema discovery, and predictive analytics.',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'DocKit by Rythmiq',
    description: 'Enterprise-grade autonomous document intelligence with AI validation and smart processing.',
    url: 'https://dockit.rythmiq.com',
    siteName: 'DocKit - Rythmiq',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Document Manager Preview',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Document Manager Pro',
    description: 'Offline-first document processing with cloud sync.',
    images: ['/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Document Manager Pro',
  },
  themeColor: '#2563eb',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Document Manager Pro" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-TileImage" content="/icons/icon-192x192.png" />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}