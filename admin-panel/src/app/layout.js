import './globals.css';

export const metadata = {
    title: 'AIBA Admin',
    description: 'AIBA Arena Admin OS',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
