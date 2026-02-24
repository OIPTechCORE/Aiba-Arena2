/**
 * Verify TON payment: tx sent to toWallet with value >= minNano.
 * Shared by guilds, brokers (create-with-ton), profile boost, gifts.
 */
async function verifyTonPayment(txHash, toWallet, minNano) {
    if (!txHash || !toWallet || !minNano) return false;
    const base = (process.env.TON_PROVIDER_URL || process.env.TON_API_URL || 'https://toncenter.com/api/v2').replace(
        /\/+$/,
        '',
    );
    const url = `${base}/getTransactionByHash?hash=${encodeURIComponent(txHash)}`;
    const opts = { headers: process.env.TON_API_KEY ? { 'X-API-Key': process.env.TON_API_KEY } : {} };
    try {
        const txRes = await fetch(url, opts);
        const txData = await txRes.json().catch(() => ({}));
        const tx = txData?.result || txData;
        const inMsg = tx?.in_msg;
        const value = inMsg?.value ? BigInt(inMsg.value) : 0n;
        const toAddr = (inMsg?.destination || '').toString();
        return value >= BigInt(minNano) && toAddr && toAddr === toWallet;
    } catch {
        return false;
    }
}

module.exports = { verifyTonPayment };
