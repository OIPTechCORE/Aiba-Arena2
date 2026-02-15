import './globals.css';
import AdminErrorBoundary from './AdminErrorBoundary';

export const metadata = {
    title: 'AIBA Admin',
    description: 'AIBA Arena Admin OS',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <AdminErrorBoundary>{children}</AdminErrorBoundary>
            </body>
        </html>
    );
}
