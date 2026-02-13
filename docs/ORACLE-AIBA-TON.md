# Holistic Automated AIBA/TON Oracle

Automated oracle that derives **AIBA per TON** from external TON price feeds and configurable AIBA USD value.

## Formula

```
AIBA_PER_TON = TON_USD / AIBA_USD
```

Example: TON = $5, AIBA = $0.001 → **5,000 AIBA per TON**.

## Data Sources

1. **CoinGecko** (primary, free, no API key): `https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd`
2. **TonAPI** (fallback, optional): requires `TON_API_KEY` env var; `https://tonapi.io/v2/rates?tokens=ton&currencies=usd`

## Configuration

| Config | Description | Default |
|--------|-------------|---------|
| `oracleAutoUpdateEnabled` | Enable cron-based auto-updates | `false` |
| `oracleAibaUsd` | Price of 1 AIBA in USD (used in formula) | `0` |
| `oracleMinAibaPerTon` | Clamp minimum rate (0 = no min) | `0` |
| `oracleMaxAibaPerTon` | Clamp maximum rate (0 = no max) | `0` |
| `oracleFallbackAibaPerTon` | Use when TON fetch fails | `0` |
| `oracleUpdateIntervalMinutes` | Cron interval (min 5) | `15` |

### Env Overrides

- `ORACLE_AIBA_USD` — Override AIBA USD price (takes precedence over config)
- `ORACLE_UPDATE_INTERVAL_MINUTES` — Cron interval (default 15)
- `TON_API_KEY` — Optional TonAPI key for backup TON price source

## Enabling Automation

1. Set `oracleAibaUsd` (e.g. `0.001`) or `ORACLE_AIBA_USD` in `.env`
2. Optionally set `oracleFallbackAibaPerTon` for when fetches fail
3. Set `oracleAutoUpdateEnabled` to `true` via Admin → Economy config (PATCH `/api/admin/economy/config`)

Cron runs every N minutes (from `ORACLE_UPDATE_INTERVAL_MINUTES`); only when `oracleAutoUpdateEnabled` and at least one of `oracleAibaUsd` / `oracleFallbackAibaPerTon` is set.

## API

- **GET** `/api/oracle/price` — Public; returns `{ aibaPerTon, neurPerAiba, updatedAt }`
- **GET** `/api/admin/oracle/status` — Admin; full oracle config
- **POST** `/api/admin/oracle/update` — Admin; trigger one update cycle

## Consumers

- `POST /api/p2p-aiba/buy` — AIBA credited at `oracleAibaPerTon * (1 - feeBps/10000)` per TON
- `POST /api/gifts/send-aiba` — TON cost = `amountAiba / oracleAibaPerTon + fee`
- `GET /api/p2p-aiba/config` — Exposes `oracleAibaPerTon` for UI

## Related

- [API-CONTRACT.md](API-CONTRACT.md) — Oracle endpoints
- [ADVISORY-TOKENOMICS-VIRAL-FOUNDER-REVENUE.md](ADVISORY-TOKENOMICS-VIRAL-FOUNDER-REVENUE.md) — Economy overview
