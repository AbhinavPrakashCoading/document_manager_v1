import 'styles/tailwind.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ExamDoc Uploader',
  description: 'Schema-aware document validation and packaging for SSC, UPSC, IELTS.',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'ExamDoc Uploader',
    description: 'Upload exam documents, validate them instantly, and package them into a submission-ready ZIP.',
    url: 'https://yourdomain.com',
    siteName: 'ExamDoc',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ExamDoc Preview',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ExamDoc Uploader',
    description: 'Instant validation and packaging for exam documents.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}