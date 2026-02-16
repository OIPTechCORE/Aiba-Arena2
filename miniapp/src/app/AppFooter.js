'use client';

import Link from 'next/link';

export function AppFooter() {
    return (
        <footer className="app-footer" role="contentinfo">
            <Link href="/privacy" className="app-footer__link">Privacy Policy</Link>
            <span className="app-footer__sep">·</span>
            <Link href="/terms" className="app-footer__link">Terms of Service</Link>
        </footer>
    );
}
