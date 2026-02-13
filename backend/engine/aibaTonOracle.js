/**
 * Holistic Automated AIBA/TON Oracle
 *
 * Derives AIBA per TON from:
 * - TON price in USD (CoinGecko free API; fallback: TonAPI if configured)
 * - AIBA price in USD (config: oracleAibaUsd; env: ORACLE_AIBA_USD override)
 *
 * Formula: AIBA_PER_TON = TON_USD / AIBA_USD
 *
 * When oracleAutoUpdateEnabled, a cron job runs this periodically.
 * Admin can also trigger manually via POST /api/admin/oracle/update
 */
const EconomyConfig = require('../models/EconomyConfig');

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
const TON_COINGECKO_ID = 'the-open-network';

/**
 * Fetch TON price in USD from CoinGecko (free tier, no API key).
 * @returns {{ tonUsd: number } | null}
 */
async function fetchTonPriceFromCoinGecko() {
    const url = `${COINGECKO_API}?ids=${TON_COINGECKO_ID}&vs_currencies=usd`;
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 8000);

    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        });
        clearTimeout(to);
        if (!res.ok) return null;
        const data = await res.json();
        const tonUsd = data?.[TON_COINGECKO_ID]?.usd;
        if (typeof tonUsd !== 'number' || tonUsd <= 0) return null;
        return { tonUsd };
    } catch (err) {
        clearTimeout(to);
        console.warn('Oracle: CoinGecko fetch failed:', err?.message);
        return null;
    }
}

/**
 * Fetch TON price from TonAPI if TON_API_KEY is set (optional backup).
 * @returns {{ tonUsd: number } | null}
 */
async function fetchTonPriceFromTonApi() {
    const key = process.env.TON_API_KEY?.trim();
    if (!key) return null;
    const url = 'https://tonapi.io/v2/rates?tokens=ton&currencies=usd';

    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 8000);

    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
        });
        clearTimeout(to);
        if (!res.ok) return null;
        const data = await res.json();
        const rates = data?.rates;
        const ton = rates?.ton ?? rates?.TON;
        const usd = ton?.prices?.usd ?? ton?.prices?.USD;
        const tonUsd = typeof usd === 'number' ? usd : null;
        if (!tonUsd || tonUsd <= 0) return null;
        return { tonUsd };
    } catch (err) {
        clearTimeout(to);
        console.warn('Oracle: TonAPI fetch failed:', err?.message);
        return null;
    }
}

/**
 * Get TON price in USD from configured sources (CoinGecko first, TonAPI backup).
 */
async function fetchTonPriceUsd() {
    const fromCg = await fetchTonPriceFromCoinGecko();
    if (fromCg) return fromCg.tonUsd;
    const fromTonApi = await fetchTonPriceFromTonApi();
    if (fromTonApi) return fromTonApi.tonUsd;
    return null;
}

/**
 * Compute AIBA per TON from TON USD and AIBA USD.
 * AIBA_PER_TON = TON_USD / AIBA_USD
 */
function computeAibaPerTon(tonUsd, aibaUsd) {
    if (!Number.isFinite(tonUsd) || tonUsd <= 0) return null;
    if (!Number.isFinite(aibaUsd) || aibaUsd <= 0) return null;
    const rate = tonUsd / aibaUsd;
    return Math.floor(rate);
}

/**
 * Run one oracle update cycle:
 * 1. Fetch TON price
 * 2. Get AIBA USD (config or env)
 * 3. Compute AIBA/TON, clamp, persist
 */
async function runOracleUpdate() {
    const cfg = await EconomyConfig.findOne();
    if (!cfg) return { ok: false, error: 'no_config' };

    const autoEnabled = cfg.oracleAutoUpdateEnabled === true;
    const aibaUsdRaw =
        process.env.ORACLE_AIBA_USD?.trim() !== ''
            ? parseFloat(process.env.ORACLE_AIBA_USD)
            : Number(cfg.oracleAibaUsd ?? 0);
    const aibaUsd = Number.isFinite(aibaUsdRaw) && aibaUsdRaw > 0 ? aibaUsdRaw : null;

    const minRate = Number(cfg.oracleMinAibaPerTon ?? 0);
    const maxRate = Number(cfg.oracleMaxAibaPerTon ?? 0);
    const fallback = Number(cfg.oracleFallbackAibaPerTon ?? 0);
    const current = Number(cfg.oracleAibaPerTon ?? 0);

    const tonUsd = await fetchTonPriceUsd();

    let newRate = null;
    if (tonUsd && aibaUsd) {
        newRate = computeAibaPerTon(tonUsd, aibaUsd);
    }

    let rateToSave = newRate;
    if (rateToSave == null) {
        if (fallback > 0) rateToSave = fallback;
        else if (current > 0) rateToSave = current;
        else return { ok: false, error: 'no_rate', tonUsd, aibaUsd };
    }

    if (minRate > 0 && rateToSave < minRate) rateToSave = minRate;
    if (maxRate > 0 && rateToSave > maxRate) rateToSave = maxRate;

    cfg.oracleAibaPerTon = rateToSave;
    cfg.oracleLastUpdatedAt = new Date();
    if (newRate != null) cfg.oracleTonUsdAtUpdate = tonUsd;
    await cfg.save();

    return {
        ok: true,
        oracleAibaPerTon: rateToSave,
        tonUsd: tonUsd ?? undefined,
        aibaUsd: aibaUsd ?? undefined,
        usedFallback: newRate == null,
        autoEnabled,
    };
}

/**
 * Whether the oracle update cron should run (config says auto + has aibaUsd or fallback).
 */
async function shouldRunOracleCron() {
    const cfg = await EconomyConfig.findOne().lean();
    if (!cfg?.oracleAutoUpdateEnabled) return false;
    const aibaUsd = process.env.ORACLE_AIBA_USD?.trim()
        ? parseFloat(process.env.ORACLE_AIBA_USD)
        : Number(cfg.oracleAibaUsd ?? 0);
    const fallback = Number(cfg.oracleFallbackAibaPerTon ?? 0);
    return (Number.isFinite(aibaUsd) && aibaUsd > 0) || fallback > 0;
}

module.exports = {
    fetchTonPriceUsd,
    runOracleUpdate,
    shouldRunOracleCron,
    computeAibaPerTon,
};
