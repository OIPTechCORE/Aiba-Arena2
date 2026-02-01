const TON_PROVIDER_URL = process.env.TON_PROVIDER_URL || 'https://testnet.toncenter.com/api/v2/jsonRPC';
const ADMIN_SIGNER_TYPE = process.env.ADMIN_SIGNER_TYPE || 'stub'; // stub | mnemonic | private_key | kms
const ADMIN_WALLET = process.env.ADMIN_WALLET || '';

const TonWeb = require('tonweb');
let TonWebMnemonic;
try {
    TonWebMnemonic = require('tonweb-mnemonic');
} catch (e) {
    /* optional dependency for mnemonic path */
}

const provider = new TonWeb.HttpProvider(TON_PROVIDER_URL);
const tonweb = new TonWeb(provider);

function parseJettonAmountToBigInt(amount) {
    // Expect "smallest units" integer; reject decimals to avoid accidental rounding.
    if (typeof amount === 'bigint') return amount;

    const asString = String(amount ?? '').trim();
    if (!asString) throw new Error('amount must be > 0');
    if (!/^\d+$/.test(asString)) throw new Error('amount must be an integer string in smallest units');

    const asBigInt = BigInt(asString);
    if (asBigInt <= 0n) throw new Error('amount must be > 0');
    return asBigInt;
}

async function sendAIBA(to, amount) {
    if (!to) throw new Error('recipient address required');
    const toAddress = String(to).trim();
    if (!toAddress) throw new Error('recipient address required');

    const jettonAmount = parseJettonAmountToBigInt(amount);

    // In CI or local dev, allow stub to avoid real transfers
    if (
        process.env.APP_ENV === 'test' ||
        process.env.NODE_ENV === 'test' ||
        ADMIN_SIGNER_TYPE === 'stub'
    ) {
        console.log(`[sendAIBA] STUB MODE: would send ${jettonAmount.toString()} to ${toAddress}`);
        return { stub: true };
    }

    // Ensure provider and admin wallet are configured
    if (!TON_PROVIDER_URL) throw new Error('TON_PROVIDER_URL is not configured');
    if (!ADMIN_WALLET) throw new Error('ADMIN_WALLET is not configured');

  // Amount handling: expect amount in smallest jetton unit (integer).
  // If you store token amounts in decimal then convert to smallest unit here.

    try {
        if (ADMIN_SIGNER_TYPE === 'mnemonic') {
            if (!TonWebMnemonic) {
                throw new Error('tonweb-mnemonic not installed. Install it to use mnemonic signer');
            }

            const mnemonic = (process.env.ADMIN_MNEMONIC || '').split(' ').filter(Boolean);
            if (mnemonic.length < 12) throw new Error('ADMIN_MNEMONIC must be set for mnemonic signer');

            const keyPair = await TonWebMnemonic.mnemonicToKeyPair(mnemonic);

            // Example wallet class (v4R2). Adjust to your wallet version.
            const WalletClass = tonweb.wallet.all.v4R2;
            const wallet = new WalletClass(tonweb.provider, { publicKey: keyPair.publicKey });
            const walletAddress = await wallet.getAddress();

            // This assumes you already know your admin jetton wallet address (ADMIN_JETTON_WALLET env var).
            // (Discovering it from jetton master is out of scope for this helper.)
            const adminJettonWalletAddress = String(process.env.ADMIN_JETTON_WALLET || '').trim();
            if (!adminJettonWalletAddress) throw new Error('ADMIN_JETTON_WALLET is required for mnemonic signer');

            const { JettonWallet } = TonWeb.token.jetton;
            const senderJettonWallet = new JettonWallet(tonweb.provider, { address: adminJettonWalletAddress });

            const transferBody = await senderJettonWallet.createTransferBody({
                jettonAmount,
                toAddress: toAddress,
                responseAddress: walletAddress.toString(true, true, true),
                forwardAmount: TonWeb.utils.toNano('0'),
                forwardPayload: null,
            });

            let seqno = await wallet.methods.seqno().call();
            if (seqno === undefined || seqno === null) seqno = 0;

            const sendRes = await wallet.methods
                .transfer({
                    secretKey: keyPair.secretKey,
                    toAddress: adminJettonWalletAddress,
                    amount: TonWeb.utils.toNano('0.05'), // gas estimate, adjust as needed
                    seqno: seqno,
                    payload: transferBody,
                    sendMode: 3,
                })
                .send();

            console.log('[sendAIBA] transfer sent', sendRes);
            return sendRes;
        }

        if (ADMIN_SIGNER_TYPE === 'private_key') {
            const pk = String(process.env.ADMIN_PRIVATE_KEY || '').trim();
            if (!pk) throw new Error('ADMIN_PRIVATE_KEY must be set for private_key signer');
            throw new Error(
                'private_key signer path is not implemented. Use ADMIN_SIGNER_TYPE=mnemonic or implement key parsing.'
            );
        }

        if (ADMIN_SIGNER_TYPE === 'kms') {
            throw new Error('KMS signer path not implemented.');
        }

        throw new Error(`Unsupported ADMIN_SIGNER_TYPE: ${ADMIN_SIGNER_TYPE}`);
    } catch (err) {
        console.error('[sendAIBA] error', err);
        throw err;
    }
}

module.exports = sendAIBA;
