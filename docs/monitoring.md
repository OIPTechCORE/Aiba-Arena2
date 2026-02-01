# Monitoring & Alerting (baseline)

This repo is instrumented primarily via logs. For production, add:

- A log drain (Render/Railway) to a log platform
- Uptime checks for backend `/health`
- TON provider error-rate monitoring (`TON_PROVIDER_URL` / `TON_API_KEY`)

## Suggested alerts

- **Battle anomaly spikes**: rising `anomalyFlags` / broker auto-bans
- **Vault low inventory**: `jettonBalance` below threshold
- **Vault low TON**: `tonBalanceNano` below threshold for gas
- **Mongo connection issues**: backend startup failures, reconnection loops

