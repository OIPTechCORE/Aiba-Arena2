'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * Reusable page navigation: Back to Previous (browser/tab history) + Back to Home.
 * Use on every page so the user can always return to where they were or to Home.
 * Card-based, modular, fits the futuristic design system.
 */
export function PageNav({ className = '', showPrevious = true, labelPrevious = '← Back to Previous', labelHome = '← Back to Home' }) {
    const router = useRouter();

    const goBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push('/');
        }
    };

    return (
        <nav className={`page-nav ${className}`} aria-label="Page navigation">
            <div className="page-nav__card">
                {showPrevious && (
                    <button
                        type="button"
                        className="page-nav__btn page-nav__btn--previous"
                        onClick={goBack}
                        aria-label="Back to previous page"
                    >
                        {labelPrevious}
                    </button>
                )}
                <Link href="/" className="page-nav__link page-nav__link--home" aria-label="Back to Home">
                    {labelHome}
                </Link>
            </div>
        </nav>
    );
}
