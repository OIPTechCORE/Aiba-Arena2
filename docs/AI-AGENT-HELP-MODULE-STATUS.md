# Deep AI agent help module (floating icon) — status

**Question:** Do we have a deep AI agent module with a floating icon that can answer questions about our app?

**Answer: Yes — a custom free agent.** The app now has:

- A **floating help icon (FAB)** bottom-right, above the tab bar
- An **in-app assistant panel** (chat-like): user types a question → gets an answer from app knowledge
- **100% client-side, no paid APIs**: keyword/phrase matching on a static knowledge base (FAQs + doc chunks). No OpenAI, Anthropic, or any external LLM.

---

## What exists today

| Feature                          | Location                                               | What it does                                                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **App assistant (custom agent)** | Floating **?** icon (bottom-right) → opens panel       | User asks in natural language. Answers come from a static Q&A list + doc chunks. Matching is keyword-based (normalize → score overlap → return best answer or fallback). No API calls. |
| **FAQs**                         | Header “FAQs” → Updates tab → scroll to `#faq-support` | Static expandable list of ~20 Q&As. Same content is used to build the agent knowledge base.                                                                                            |
| **University / Guide**           | Header “Guide” → University tab                        | Step-by-step courses and modules.                                                                                                                                                      |
| **Contact support**              | Updates tab, below FAQs                                | Form for human support.                                                                                                                                                                |
| **In-tab hints**                 | Every tab                                              | Card hints explaining each feature.                                                                                                                                                    |

---

## How the custom agent works

1. **Knowledge base** (`miniapp/src/lib/agentKnowledge.js`)
    - **Q&A entries:** Each has `patterns` (keywords/phrases) and an `answer`. Built from the FAQs in `HomeContent.js` plus extra phrasings (e.g. “how do i get neur”, “what is broker”).
    - **Doc chunks:** Short `{ title, text }` for fallback (e.g. “Core loop”, “Brokers”, “Economy”).

2. **Matching** (same file, `getAnswer(query)`)
    - Normalize user input (lowercase, trim, tokenize).
    - Score each Q&A by word/phrase overlap between query and patterns; score chunks by overlap with title + text.
    - Return the best answer above a threshold, or a fallback: “I didn’t find a close match. Try … or open Updates → FAQs.”

3. **UI** (`miniapp/src/components/AgentFab.js`)
    - **FAB:** Fixed bottom-right (above tab bar), “?” icon. Toggles panel.
    - **Panel:** Title “App assistant”, short hint, scrollable message list (user + assistant), text input + “Ask” button. Uses existing design tokens (e.g. `card`, `btn`, `input` in spirit).

4. **Integration**
    - `AgentFab` is rendered in `HomeContent.js` so the assistant is available on all tabs. No backend; no API keys.

---

## What “deep AI agent + floating icon” could still mean (optional, paid)

To have a **LLM-powered** agent that answers arbitrary questions in natural language (not just keyword match), you would add:

1. **Floating icon + chat UI** — ✅ Already done (FAB + panel).
2. **Backend** calling an LLM (OpenAI, Anthropic, etc.) with a system prompt built from app docs/FAQs. Or RAG over docs.
3. **Security and cost:** No PII in prompts; rate limits; optional feature flag.

The current implementation deliberately avoids paid APIs and runs entirely in the frontend.

---

## Summary

| Item                                           | Status                                                           |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| Floating help icon (FAB)                       | ✅ Implemented                                                   |
| In-app assistant panel (chat-like)             | ✅ Implemented                                                   |
| Custom free agent (keyword-based, no paid API) | ✅ Implemented                                                   |
| Static FAQs + support form                     | ✅ Implemented (Updates tab)                                     |
| University / Guide                             | ✅ Implemented                                                   |
| LLM-powered “answer anything” agent            | ❌ Not implemented (would require paid API or self-hosted model) |

The **App assistant** is the “deep” help module for the app within the constraint of no paid systems: it answers from app knowledge via client-side matching and is available from the floating icon on every tab.
