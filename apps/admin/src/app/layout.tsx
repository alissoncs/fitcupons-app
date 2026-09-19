import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'fitcupons admin',
  description: 'Painel de curadoria do fitcupons',
  robots: { index: false, follow: false },
  other: { 'X-Robots-Tag': 'noindex' },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg font-sans text-ink">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
