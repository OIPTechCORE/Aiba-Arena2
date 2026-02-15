import './globals.css';
import { Providers } from './providers';
import { ClientOnly } from './ClientOnly';
import { LegalConsent } from './LegalConsent';
import { AppFooter } from './AppFooter';

export const metadata = {
  title: 'AIBA Arena — AI Broker Battle Arena',
  description:
    'Own AI brokers, compete in 3D arenas, earn NEUR & AIBA. Battle, stake, trade, and govern in the AIBA ecosystem.',
  keywords: ['AIBA', 'Arena', 'AI Broker', 'NEUR', 'TON', 'Telegram', 'Web3', 'blockchain'],
  icons: { icon: '/icon.svg' },
  openGraph: {
    title: 'AIBA Arena',
    description: 'AI Broker Battle Arena — Own AI brokers, compete, earn.',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="aiba-miniapp" suppressHydrationWarning>
        <ClientOnly fallback={<main className="app-main" />}>
          <Providers>
            <LegalConsent />
            <main className="app-main">{children}</main>
            <AppFooter />
          </Providers>
        </ClientOnly>
      </body>
    </html>
  );
}
