# Monitoring & Alerting (baseline)

This repo is instrumented primarily via logs. For production, add:

- A log drain (Render/Railway) to a log platform
- Uptime checks for backend `/health`
- Prometheus scraping for backend `/metrics`
- TON provider error-rate monitoring (`TON_PROVIDER_URL` / `TON_API_KEY`)

## Suggested alerts

- **Battle anomaly spikes**: rising `anomalyFlags` / broker auto-bans
- **Economy ledger anomalies**: spikes in NEUR debits/credits or AIBA burns
- **Vault low inventory**: `jettonBalance` below threshold
- **Vault low TON**: `tonBalanceNano` below threshold for gas
- **Mongo connection issues**: backend startup failures, reconnection loops

### Suggested alerts (Prometheus metrics)- **Battle errors**: `rate(aiba_battle_runs_total{result="error"}[5m])` above baseline
- **Battle anomalies**: `rate(aiba_battle_anomalies_total[5m])` spikes (break down by `arena`/`league`/`mode_key`)
- **Auto-ban spikes**: `rate(aiba_auto_bans_total{entity=~"user|broker"}[15m])` spikes
- **Emission denials**: `rate(aiba_economy_emissions_total{result!="ok"}[10m])` spikes (labels: `currency`, `arena`, `league`)
- **Sink spikes**: `rate(aiba_economy_sinks_total[10m])` spikes (labels: `currency`, `reason`)
- **Withdrawal failures**: `rate(aiba_economy_withdrawals_total{result!="ok"}[10m])` above baseline## Metrics endpoint- **Backend**: `GET /metrics` (Prometheus format)
- Includes:
    - Default Node.js/process metrics (prefixed `aiba_...`)
    - HTTP request duration histogram: `aiba_http_request_duration_seconds`
    - Battle counters:
        - `aiba_battle_runs_total`
        - `aiba_battle_anomalies_total`
        - `aiba_auto_bans_total`
    - Economy counters:
        - `aiba_economy_emissions_total`
        - `aiba_economy_sinks_total`
        - `aiba_economy_withdrawals_total`
