# Telegram Apps Moderation Advisory — AIBA Arena

This advisory supports registering **AIBA Arena** in the Telegram Apps Moderation Center for listing on tapps.center and exposure via @tapps_bot.

---

## Submission Channels

| Resource            | Link                                                       | Purpose                                |
| ------------------- | ---------------------------------------------------------- | -------------------------------------- |
| **Submit Your App** | [t.me/app_moderation_bot](https://t.me/app_moderation_bot) | Official moderation / submission bot   |
| **Apps Center**     | [tapps.center](https://tapps.center)                       | Browse and discover Telegram mini-apps |
| **Tapps Bot**       | [t.me/tapps_bot](https://t.me/tapps_bot)                   | Bot for browsing and launching apps    |

---

## A) Probability of Approval

### Overall estimate: **Medium–High (≈65–80%)** if policy-compliant and well presented

#### Strengths

1. **Working HTTPS app** — Deployed, functional, stable WebApp.
2. **TON integration** — Wallet connect (TonConnect), TON blockchain (AIBA jettons, NEUR credits).
3. **Clear value proposition** — Play-to-earn broker battles, referral system, guilds, marketplace.
4. **No obvious gambling** — Battles are skill/simulation-based, not pure chance.
5. **User onboarding** — Clear flow (connect wallet, create broker, run battles, earn rewards).

#### Risk factors

1. **Token / earnings** — AIBA and NEUR mechanics may be scrutinized. Ensure:
    - Clear disclosure (no false promises).
    - No misleading “guaranteed profit” language.
2. **Referral rewards** — Tiered bonuses (10×, 100×) are common; keep them transparent.
3. **Wallet requirement** — Referee must connect wallet to apply a referral; moderators may question if this feels too restrictive.

#### Practical tips

- Provide a short, accurate description (no hype).
- Use high-quality app icon and screenshots.
- Have a privacy policy and terms of service ready.
- Ensure the app works smoothly on first launch (no critical bugs).

---

## B) Possible Position in Apps Center

### Categories that fit AIBA Arena

| Category         | Fit          | Notes                                               |
| ---------------- | ------------ | --------------------------------------------------- |
| **Games**        | ✓ High       | Broker battles, arenas, scoring. Primary fit.       |
| **Play to Earn** | ✓ High       | Battle rewards (AIBA), referrals, tasks.            |
| **NFT**          | ✓ Medium     | Brokers as collectibles; marketplace; guild assets. |
| **Finance**      | △ Low–Medium | NEUR/AIBA economy; better as secondary.             |
| **Other**        | Fallback     | Use if none above feel right.                       |

Recommendation: **Primary category “Games”**, optionally tag **Play to Earn** and **NFT** if the submission form allows multiple tags.

### Realistic positions

| Placement                | Probability | Notes                                                                                      |
| ------------------------ | ----------- | ------------------------------------------------------------------------------------------ |
| **New** badge            | High        | New apps often appear in “New” section automatically.                                      |
| **Games** listing        | High        | Strong match for broker battles + arenas.                                                  |
| **Play to Earn** listing | Medium–High | Earn AIBA/NEUR via battles and referrals.                                                  |
| **Trending**             | Low–Medium  | Depends on user traction (MAU, DAU).                                                       |
| **Editors’ Choice**      | Very Low    | Curated (Notcoin, Battles, Gatto, Major, etc.); requires exceptional quality and adoption. |

### Summary

- **Most likely**: Listed under **Games** and possibly **Play to Earn**, with a **New** badge.
- **With traction**: Could appear in **Trending**.
- **Editors’ Choice**: Only with sustained growth and standout UX/retention.

---

## Submission Checklist

- [ ] App URL (HTTPS)
- [ ] Short description (2–3 sentences)
- [ ] App icon (square, high resolution)
- [ ] Screenshots (e.g., Home, Brokers, Battle result, Referrals)
- [ ] Category selection (Games, Play to Earn, NFT as applicable)
- [x] **Privacy policy link** — Implemented: [`docs/PRIVACY-POLICY.md`](./PRIVACY-POLICY.md), in-app at `/privacy` and linked from Settings → Privacy & data
- [x] **Terms of service** — Implemented: [`docs/TERMS-OF-SERVICE.md`](./TERMS-OF-SERVICE.md), in-app at `/terms` and linked from Settings
- [x] **No misleading or scam-like claims** — Implemented: earnings disclaimer in Wallet tab and FAQs; Terms §3 ("No Guaranteed Profits") explicitly disclaims guaranteed rewards
- [ ] Test thoroughly before submitting

---

## Implementation Status (Moderation Advisory Compliance)

| Requirement                                | Status | Implementation                                                  |
| ------------------------------------------ | ------ | --------------------------------------------------------------- |
| Clear disclosure (no false promises)       | ✓ Done | Terms §3, Wallet disclaimer banner, FAQs "Earnings disclaimer?" |
| No misleading "guaranteed profit" language | ✓ Done | Terms §3, Wallet & FAQ disclaimers                              |
| Privacy policy ready                       | ✓ Done | `docs/PRIVACY-POLICY.md`, `/privacy` page, Settings link        |
| Terms of service ready                     | ✓ Done | `docs/TERMS-OF-SERVICE.md`, `/terms` page, Settings link        |
| Referral rewards transparent               | ✓ Done | Creator tiers (2–7%) shown in UI and FAQs                       |

**In-app links for submission form:**

- Privacy Policy: `https://<your-miniapp-domain>/privacy`
- Terms of Service: `https://<your-miniapp-domain>/terms`

---

## Related docs

- [PRIVACY-POLICY.md](./PRIVACY-POLICY.md) — Privacy policy
- [TERMS-OF-SERVICE.md](./TERMS-OF-SERVICE.md) — Terms of service (includes earnings disclaimer)
- [GAME-FUNCTIONALITY.md](./GAME-FUNCTIONALITY.md) — Game mechanics and architecture
- [ADVISORY-TOKENOMICS-VIRAL-FOUNDER-REVENUE.md](./ADVISORY-TOKENOMICS-VIRAL-FOUNDER-REVENUE.md) — Tokenomics and viral design
