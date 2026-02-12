import './globals.css';
import { Providers } from './providers';

export const metadata = {
    title: 'AIBA Arena',
    description: 'AI Broker Battle Arena',
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
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
