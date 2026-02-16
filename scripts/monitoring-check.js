#!/usr/bin/env node
/**
 * Comprehensive monitoring script for AIBA Arena backend.
 * Health + metrics validation + vault check + threshold alerts.
 *
 * Use for cron, uptime monitors, or alerting pipelines.
 *
 * Usage:
 *   node scripts/monitoring-check.js
 *   BACKEND_URL=https://api.example.com node scripts/monitoring-check.js
 *   node scripts/monitoring-check.js --vault          # Include vault TON check
 *   node scripts/monitoring-check.js --json            # JSON output for alerting
 *   MIN_VAULT_TON_NANO=50000000 node scripts/monitoring-check.js --vault
 *
 * Exit: 0 on success, 1 on failure.
 * Default backend: http://localhost:5000 (set BACKEND_URL or NEXT_PUBLIC_BACKEND_URL for prod).
 */

const baseUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const checkVault = process.argv.includes('--vault');
const outputJson = process.argv.includes('--json');

const EXPECTED_METRICS = [
    'aiba_http_request_duration_seconds',
    'aiba_battle_runs_total',
    'aiba_battle_anomalies_total',
    'aiba_auto_bans_total',
    'aiba_economy_emissions_total',
    'aiba_economy_sinks_total',
    'aiba_economy_withdrawals_total',
];

async function fetchWithTimeout(url, opts = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 20000);
    try {
        const res = await globalThis.fetch(url, { ...opts, signal: controller.signal });
        clearTimeout(id);
        return res;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
}

function hasMetric(metricsText, name) {
    return metricsText.includes(name);
}

async function main() {
    const start = Date.now();
    const result = {
        ok: true,
        errors: [],
        checks: {},
        durationMs: 0,
    };

    // 1. Health
    try {
        const res = await fetchWithTimeout(`${baseUrl}/health`);
        const body = await res.json();
        if (!res.ok || !body?.ok) {
            result.errors.push(`/health failed: status=${res.status} ok=${body?.ok}`);
            result.ok = false;
        }
        result.checks.health = { ok: res.ok && body?.ok, status: res.status };
    } catch (e) {
        result.errors.push(`/health error: ${e.message || e}`);
        result.ok = false;
        result.checks.health = { ok: false, error: String(e.message || e) };
    }

    // 2. Metrics (Prometheus) + validate expected series
    try {
        const res = await fetchWithTimeout(`${baseUrl}/metrics`);
        const text = await res.text();
        if (!res.ok) {
            result.errors.push(`/metrics returned ${res.status}`);
            result.ok = false;
        }
        const missing = EXPECTED_METRICS.filter((m) => !hasMetric(text, m));
        if (missing.length > 0) {
            result.errors.push(`Metrics missing: ${missing.join(', ')}`);
            result.ok = false;
        }
        result.checks.metrics = {
            ok: res.ok && missing.length === 0,
            status: res.status,
            missing: missing.length > 0 ? missing : undefined,
        };
    } catch (e) {
        result.errors.push(`/metrics error: ${e.message || e}`);
        result.ok = false;
        result.checks.metrics = { ok: false, error: String(e.message || e) };
    }

    // 3. Vault inventory (optional)
    if (checkVault) {
        try {
            const res = await fetchWithTimeout(`${baseUrl}/api/vault/inventory`);
            if (!res.ok) {
                result.errors.push(`/api/vault/inventory returned ${res.status}`);
                result.ok = false;
            }
            const inv = await res.json();
            const tonNano = BigInt(inv?.tonBalanceNano ?? 0);
            const minTon = BigInt(process.env.MIN_VAULT_TON_NANO ?? '30000000');
            if (tonNano < minTon) {
                result.errors.push(`Vault TON low: ${tonNano} < ${minTon} nano`);
                result.ok = false;
            }
            result.checks.vault = {
                ok: res.ok && tonNano >= minTon,
                tonBalanceNano: String(tonNano),
                minRequired: String(minTon),
            };
        } catch (e) {
            result.errors.push(`/api/vault/inventory error: ${e.message || e}`);
            result.ok = false;
            result.checks.vault = { ok: false, error: String(e.message || e) };
        }
    }

    result.durationMs = Date.now() - start;

    if (outputJson) {
        console.log(JSON.stringify(result, null, 2));
    } else {
        if (result.ok) {
            console.log('Monitoring check OK');
        } else {
            console.error('Monitoring check FAILED:');
            result.errors.forEach((e) => console.error('  -', e));
        }
    }

    process.exit(result.ok ? 0 : 1);
}

main().catch((e) => {
    const err = { ok: false, errors: [String(e.message || e)], durationMs: 0 };
    if (outputJson) {
        console.log(JSON.stringify(err, null, 2));
    } else {
        console.error('Monitoring check error:', e);
    }
    process.exit(1);
});
