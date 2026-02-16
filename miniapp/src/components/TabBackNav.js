'use client';

/**
 * In-app tab navigation: Back to Previous (tab) + Back to Home.
 * Single source of truth for tab back nav to avoid duplicate JSX.
 */
export function TabBackNav({ previousTab, onGoToPrevious, onGoToHome, disabled, className = '' }) {
    const showPrevious = previousTab && previousTab !== 'home';

    return (
        <div className={`page-nav__card tab-back-nav ${className}`.trim()}>
            {showPrevious && (
                <button
                    type="button"
                    className="btn btn--ghost page-nav__btn"
                    onClick={onGoToPrevious}
                    disabled={disabled}
                    aria-label="Back to previous"
                >
                    ← Back to Previous
                </button>
            )}
            <button
                type="button"
                className="btn btn--ghost page-nav__btn"
                onClick={onGoToHome}
                disabled={disabled}
                aria-label="Back to Home"
            >
                ← Back to Home
            </button>
        </div>
    );
}
