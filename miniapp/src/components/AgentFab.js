'use client';

import { useState, useRef, useEffect } from 'react';
import { getAnswer } from '../lib/agentKnowledge';

const IconHelp = () => (
    <svg
        className="icon-svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
    >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
    </svg>
);

const IconClose = () => (
    <svg
        className="icon-svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
    >
        <path d="M18 6L6 18M6 6l12 12" />
    </svg>
);

const IconSend = () => (
    <svg
        className="icon-svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
    >
        <path d="M22 2L11 13" />
        <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
);

export function AgentFab() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const listRef = useRef(null);

    useEffect(() => {
        if (open && listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [open, messages]);

    function handleAsk() {
        const q = (input || '').trim();
        if (!q) return;
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', text: q }]);
        const result = getAnswer(q);
        const reply = result
            ? result.source && result.source !== 'Assistant'
                ? `${result.answer}\n\n— Source: ${result.source}`
                : result.answer
            : "I didn't find a match. Try the FAQs in Updates or contact support from the Updates tab.";
        setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    }

    return (
        <>
            <button
                type="button"
                className="agent-fab"
                onClick={() => setOpen((o) => !o)}
                aria-label={open ? 'Close app assistant' : 'Open app assistant'}
                aria-expanded={open}
            >
                <IconHelp />
            </button>
            {open && (
                <div className="agent-panel" role="dialog" aria-label="App assistant">
                    <div className="agent-panel__header">
                        <span className="agent-panel__title">App assistant</span>
                        <button
                            type="button"
                            className="agent-panel__close"
                            onClick={() => setOpen(false)}
                            aria-label="Close"
                        >
                            <IconClose />
                        </button>
                    </div>
                    <p className="agent-panel__hint">
                        Ask about brokers, arenas, wallet, rewards, referrals, and more. Answers come from app FAQs — no
                        AI API.
                    </p>
                    <div className="agent-panel__list" ref={listRef}>
                        {messages.length === 0 ? (
                            <p className="agent-panel__placeholder">
                                Type a question below and tap Ask. Try: &quot;How do I start?&quot; or &quot;What is a
                                broker?&quot;
                            </p>
                        ) : (
                            messages.map((m, i) => (
                                <div key={i} className={`agent-msg agent-msg--${m.role}`}>
                                    <div className="agent-msg__bubble">
                                        {m.text.split('\n').map((line, j) => (
                                            <p key={j} className="agent-msg__text">
                                                {line || '\u00A0'}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="agent-panel__input-row">
                        <input
                            type="text"
                            className="input agent-panel__input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                            placeholder="Ask a question..."
                            aria-label="Your question"
                        />
                        <button
                            type="button"
                            className="btn btn--primary agent-panel__ask"
                            onClick={handleAsk}
                            disabled={!input.trim()}
                        >
                            <IconSend /> Ask
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
