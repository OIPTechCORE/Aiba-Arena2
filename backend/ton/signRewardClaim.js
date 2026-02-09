const nacl = require('tweetnacl');
const axios = require('axios');
const { beginCell, Address, Cell } = require('@ton/core');

function parsePrivateKey(env = process.env) {
    // Expect 32-byte seed as hex in ORACLE_PRIVATE_KEY_HEX
    const hex = String(env?.ORACLE_PRIVATE_KEY_HEX || '').trim();
    if (!hex) throw new Error('ORACLE_PRIVATE_KEY_HEX missing');
    const seed = Buffer.from(hex, 'hex');
    if (seed.length !== 32) throw new Error('ORACLE_PRIVATE_KEY_HEX must be 32 bytes (64 hex chars)');
    return seed;
}

function getKeyPair(env = process.env) {
    const seed = parsePrivateKey(env);
    return nacl.sign.keyPair.fromSeed(new Uint8Array(seed));
}

function buildClaimPayload({ vaultAddress, jettonMaster, to, amount, seqno, validUntil }) {
    const vault = Address.parse(vaultAddress);
    const master = Address.parse(jettonMaster);
    const toAddr = Address.parse(to);

    const c = beginCell()
        .storeAddress(vault)
        .storeAddress(master)
        .storeAddress(toAddr)
        .storeCoins(BigInt(amount))
        .storeUint(BigInt(seqno), 64)
        .storeUint(BigInt(validUntil), 32)
        .endCell();

    return c;
}

function signClaimHash(cell, env = process.env) {
    const kp = getKeyPair(env);
    const hash = cell.hash(); // Buffer(32)
    const sig = nacl.sign.detached(new Uint8Array(hash), kp.secretKey);
    return Buffer.from(sig);
}

async function createSignedClaim({ vaultAddress, jettonMaster, to, amount, seqno, validUntil }, env = process.env) {
    const payloadCell = buildClaimPayload({ vaultAddress, jettonMaster, to, amount, seqno, validUntil });
    const payloadBocBase64 = payloadCell.toBoc().toString('base64');

    const signerUrl = String(env?.ORACLE_SIGNER_URL || '').trim();
    if (signerUrl) {
        const token = String(env?.ORACLE_SIGNER_TOKEN || '').trim();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resp = await axios.post(
            signerUrl,
            {
                vaultAddress,
                jettonMaster,
                to,
                amount,
                seqno,
                validUntil,
                payloadBocBase64,
            },
            { headers, timeout: 10_000 },
        );
        const signatureBase64 = resp?.data?.signatureBase64;
        if (!signatureBase64) throw new Error('oracle signer did not return signatureBase64');
        return { payloadBocBase64, signatureBase64 };
    }

    const signature = signClaimHash(payloadCell, env);

    return {
        payloadBocBase64,
        signatureBase64: signature.toString('base64'),
    };
}

module.exports = { createSignedClaim, buildClaimPayload, parsePrivateKey };
