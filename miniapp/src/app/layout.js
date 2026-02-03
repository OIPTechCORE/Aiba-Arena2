import './globals.css';
import { Providers } from './providers';

export const metadata = {
    title: 'AIBA Arena',
    description: 'AI Broker Battle Arena',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="aiba-miniapp">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
