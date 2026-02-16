'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY_AGREED = 'aiba_legal_agreed';
const STORAGE_KEY_DECLINED = 'aiba_legal_declined';

export function LegalConsent() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        try {
            if (typeof window === 'undefined') return;
            const inIframe = window.self !== window.top;
            const previewParam = typeof window.location !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === '1';
            if (inIframe || previewParam) return;
            const agreed = localStorage.getItem(STORAGE_KEY_AGREED);
            const declined = localStorage.getItem(STORAGE_KEY_DECLINED);
            if (!agreed && !declined) setShow(true);
        } catch {
            setShow(true);
        }
    }, []);

    const handleAgree = () => {
        try {
            localStorage.setItem(STORAGE_KEY_AGREED, '1');
        } catch {}
        setShow(false);
    };

    const handleDecline = () => {
        try {
            localStorage.setItem(STORAGE_KEY_DECLINED, '1');
        } catch {}
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="legal-consent-overlay" role="dialog" aria-modal="true" aria-labelledby="legal-consent-title">
            <div className="legal-consent-card">
                <h2 id="legal-consent-title" className="legal-consent-title">Welcome to AIBA Arena</h2>
                <p className="legal-consent-text">
                    Before you continue, please read and accept our terms. By using the app you agree to our data practices and rules of use.
                </p>
                <div className="legal-consent-links">
                    <Link href="/privacy" className="legal-consent-link">Privacy Policy</Link>
                    <span className="legal-consent-sep">·</span>
                    <Link href="/terms" className="legal-consent-link">Terms of Service</Link>
                </div>
                <p className="legal-consent-hint">You can read these anytime in Settings or from the links below.</p>
                <div className="legal-consent-actions">
                    <button type="button" className="btn btn--secondary" onClick={handleDecline}>
                        Decline
                    </button>
                    <button type="button" className="btn btn--primary" onClick={handleAgree}>
                        I Agree
                    </button>
                </div>
            </div>
        </div>
    );
}
