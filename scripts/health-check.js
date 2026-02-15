#!/usr/bin/env node
/**
 * Health check script for AIBA Arena backend.
 * Use for monitoring, cron jobs, or CI.
 *
 * Usage:
 *   node scripts/health-check.js
 *   BACKEND_URL=https://api.example.com node scripts/health-check.js
 *   node scripts/health-check.js --vault
 *
 * Exit: 0 on success, 1 on failure.
 */

const baseUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const checkVault = process.argv.includes('--vault');

async function fetchWithTimeout(url, opts = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 15000);
    try {
        const res = await globalThis.fetch(url, { ...opts, signal: controller.signal });
        clearTimeout(id);
        return res;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
}

async function main() {
    const errors = [];

    // 1. Health
    try {
        const res = await fetchWithTimeout(`${baseUrl}/health`);
        if (!res.ok) errors.push(`/health returned ${res.status}`);
        else {
            const j = await res.json();
            if (!j?.ok) errors.push('/health ok=false');
        }
    } catch (e) {
        errors.push(`/health failed: ${e.message || e}`);
    }

    // 2. Metrics (Prometheus)
    try {
        const res = await fetchWithTimeout(`${baseUrl}/metrics`);
        if (!res.ok) errors.push(`/metrics returned ${res.status}`);
    } catch (e) {
        errors.push(`/metrics failed: ${e.message || e}`);
    }

    // 3. Vault inventory (optional)
    if (checkVault) {
        try {
            const res = await fetchWithTimeout(`${baseUrl}/api/vault/inventory`);
            if (!res.ok) errors.push(`/api/vault/inventory returned ${res.status}`);
            else {
                const inv = await res.json();
                const tonNano = BigInt(inv?.tonBalanceNano ?? 0);
                const minTon = BigInt(process.env.MIN_VAULT_TON_NANO ?? '30000000');
                if (tonNano < minTon) errors.push(`Vault TON low: ${tonNano} < ${minTon} nano`);
            }
        } catch (e) {
            errors.push(`/api/vault/inventory failed: ${e.message || e}`);
        }
    }

    if (errors.length) {
        console.error('Health check failed:');
        errors.forEach((e) => console.error('  -', e));
        process.exit(1);
    }
    console.log('Health check OK');
}

main().catch((e) => {
    console.error('Health check error:', e);
    process.exit(1);
});
