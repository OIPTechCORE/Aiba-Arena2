# Gifting — Single reference

**Unified doc** for in-app gifting: generic send (TON, AIBA) and **campaigns** (e.g. Ramadhan, loved ones) that use the same API with different copy and placement.

---

## 1. What exists today

| Feature             | API                                              | UI                                                                                       | Notes                                                                          |
| ------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Send gift (TON)** | `POST /api/gifts/send`                           | Wallet tab → Gifts: to (Telegram ID or @username), txHash (TON to GIFTS_WALLET), message | Pay configurable TON (e.g. 1 TON) to GIFTS_WALLET; recipient gets gift record. |
| **Send AIBA gift**  | `POST /api/gifts/send-aiba`                      | Wallet tab: to, amountAiba, txHash (proof)                                               | Send AIBA to another user (off-chain credit); optional TON proof.              |
| **Received / sent** | `GET /api/gifts/received`, `GET /api/gifts/sent` | Wallet tab                                                                               | List gifts received and sent.                                                  |

Gifting is **recipient-agnostic**: you send to any user (by Telegram ID or username). There is no separate “Ramadhan” or “loved ones” product in the backend — those are **campaigns** (see §2).

---

## 2. Gifting for Ramadhan / loved ones

**Do we have gifting for Ramadhan?**  
**Do we have gifting for loved ones?**

**Answer:** The **same gifting API and flows** support both. There are no dedicated “Ramadhan” or “loved ones” endpoints; you use the existing **Send gift (TON)** and **Send AIBA gift** and surface them with campaign-specific copy and placement.

| Campaign       | How to support                                                                                                                                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ramadhan**   | Use existing `/api/gifts/send` and `/api/gifts/send-aiba`. Add a **Ramadhan** hero or card in the miniapp (e.g. Wallet or Home) with copy like “Send a gift this Ramadhan” and the same send form or deep-link to Wallet → Gifts. Optionally: admin sets a seasonal banner or announcement. |
| **Loved ones** | Same: “Send to loved ones” card or banner that links to the same Gifts UI (send TON or send AIBA). No backend change.                                                                                                                                                                       |

So: **A. Gifting for Ramadhan** = yes, via existing gifting + campaign UI/copy.  
**B. Gifting for loved ones** = yes, via existing gifting + campaign UI/copy.

Optional future: product keys (e.g. `gift_ramadhan`, `gift_loved_ones`) for analytics or badges — still same API, with an optional `campaign` or `productKey` field on the gift record if you want to segment later.

---

## 3. Quick reference

| Concept                   | Where          | API                                                                        |
| ------------------------- | -------------- | -------------------------------------------------------------------------- |
| **Send TON gift**         | Wallet → Gifts | POST /api/gifts/send (txHash, toTelegramId or toUsername, message)         |
| **Send AIBA gift**        | Wallet         | POST /api/gifts/send-aiba (txHash, amountAiba, toTelegramId or toUsername) |
| **Received / sent**       | Wallet         | GET /api/gifts/received, GET /api/gifts/sent                               |
| **Ramadhan / loved ones** | Campaigns      | Same APIs; add campaign-specific cards/banners and copy in the miniapp.    |

**Config:** `EconomyConfig.giftCostTonNano`, `GIFTS_WALLET` (env). See [SUPER-ADMIN-WALLETS.md](SUPER-ADMIN-WALLETS.md).
