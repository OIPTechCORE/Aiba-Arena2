# Custom AI Help Agent — Deep Plan (Zero Cost)

This document describes the **fully custom, free** in-app help agent: architecture, design, knowledge coverage, and maintenance. **No paid APIs or external AI services** are used.

---

## 1. Goals

- **Free:** 100% client-side or minimal backend; no OpenAI, Anthropic, or other paid LLM/API.
- **Useful:** Answer common questions about brokers, arenas, wallet, rewards, MemeFi, redemption, guilds, staking, DAO, referrals, and general “how do I…?”.
- **Discoverable:** Floating help icon (FAB) on all main tabs so users can ask without leaving the page.
- **Honest:** Clearly state that answers come from app FAQs and docs, not from a live AI.

---

## 2. Architecture

| Layer         | Implementation                                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Knowledge** | Single source: `miniapp/src/lib/agentKnowledge.js`. Array of Q&A (patterns + answer) and optional doc chunks (title + text).                                       |
| **Matching**  | Client-side only: normalize query → tokenize → score by keyword/phrase overlap → return best answer or fallback. No network call.                                  |
| **UI**        | `miniapp/src/components/AgentFab.js`: fixed FAB (bottom-right), chat-style panel (messages + input + Ask). Rendered in `HomeContent.js` so it appears on all tabs. |
| **Backend**   | None required. Optional future: `POST /api/help-agent/ask` for logging or analytics only (same matching logic, no external API).                                   |

---

## 3. Knowledge Base Strategy

- **Q&A entries:** Each entry has `patterns: string[]` (keywords/phrases) and `answer: string`. Many phrasings per topic (e.g. “how get broker”, “how do i get a broker”, “create broker”, “first broker”) so short or long questions match.
- **Chunks:** Short paragraphs (title + text) for “Core loop”, “Brokers”, “Arenas”, “Economy”, “Wallet”, “MemeFi”, “Redemption”, etc. Used when no Q&A scores high enough; matching is token-overlap on title + text.
- **Sources:** Content is derived from USER-GUIDE, GAME-STRUCTURE, WHAT-IS-AIBA-ARENA, in-app FAQs (Updates), MemeFi docs, redemption, and feature copy. Kept in one file so non-devs can extend by adding patterns and answers.

---

## 4. Matching Algorithm

1. **Normalize:** Lowercase, remove punctuation, collapse spaces.
2. **Tokenize:** Split into words; ignore very short tokens.
3. **Phrase boost:** If the normalized query **contains** any pattern string (substring), add a fixed boost to that Q&A’s score so natural questions like “how do I get my first broker?” match “how get broker”.
4. **Token overlap:** Score = (hits / query length) for Q&A patterns and for chunks; partial matches (substring) get 0.5 per token.
5. **Thresholds:** Q&A threshold (e.g. 0.25) preferred over chunks (e.g. 0.2). Below chunk threshold → return fallback with suggested questions and “see Updates → FAQs”.

---

## 5. UX

- **FAB:** Single “?” or help icon, bottom-right, above tab bar. Accessible label: “Open app assistant” / “Close app assistant”.
- **Panel:** Title “App assistant”, short hint that answers are from app FAQs (no AI API), message list (user + assistant bubbles), text input, “Ask” button. Enter key submits.
- **Fallback:** When no match, suggest 3–4 example questions and point to Updates → FAQs and contact support.
- **Optional:** Suggested questions as chips when the panel is empty (e.g. “How do I start?”, “What is a broker?”, “How do I earn AIBA?”) to reduce blank-state friction.

---

## 6. Coverage (Topics)

The knowledge base aims to cover:

- What is AIBA / broker / arena / battle; how to start; first steps.
- Brokers: get, create, combine, mint, train, repair, upgrade, list, market, guild deposit/withdraw.
- Arenas: modes, leagues, energy, cooldown, Stars/Diamond rewards.
- Economy: NEUR, AIBA, Stars, Diamonds, badges; where to see them; how to earn.
- Wallet: connect TON, vault, create claim, auto-claim, claim on-chain, saved claim address.
- Staking: flexible/locked, min stake, APY, cancel-early fee.
- Referrals: code, share, creator economy, tiers.
- Memes/MemeFi: create, boost, share, comment, report, daily pool, leaderboard.
- Earn tab: ways to earn, redemption products (school fee, LMS, exam prep, merch).
- University/Guide, tasks, daily reward, Global Boss.
- Guilds: create, join, boost, deposit/withdraw broker, guild wars.
- Market: buy/sell brokers, system shop, create with TON.
- Racing (car/bike), Predict (Battle of the hour), DAO, Charity, Multiverse (NFT stake).
- Support: FAQs, contact form, bugs, disclaimer.

---

## 7. Maintenance

- **Add Q&A:** Append new `{ patterns: [...], answer: '...' }` to `Q_AND_A` in `agentKnowledge.js`; add multiple phrasings per topic.
- **Add chunks:** Append `{ title: '...', text: '...' }` to `CHUNKS` for paragraph-style answers.
- **Tune thresholds:** Adjust 0.25 / 0.2 in `getAnswer()` if too many false positives or negatives.
- **Sync with docs:** When USER-GUIDE or FAQs change, update the corresponding patterns/answers so the agent stays aligned.

---

## 8. Status

- **Implemented:** Yes. `agentKnowledge.js` (knowledge + `getAnswer`) and `AgentFab.js` (FAB + panel) are in the repo; `AgentFab` is rendered in `HomeContent.js`.
- **Cost:** Zero. No API keys; no paid systems.
- **Location:** FAB bottom-right; open with the help icon; ask in natural language and tap Ask.

See also: `docs/AI-AGENT-HELP-MODULE-STATUS.md` for a short status summary.
