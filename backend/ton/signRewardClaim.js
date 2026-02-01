const nacl = require('tweetnacl');
const { beginCell, Address, Cell } = require('@ton/core');

function parsePrivateKey() {
    // Expect 32-byte seed as hex in ORACLE_PRIVATE_KEY_HEX
    const hex = String(process.env.ORACLE_PRIVATE_KEY_HEX || '').trim();
    if (!hex) throw new Error('ORACLE_PRIVATE_KEY_HEX missing');
    const seed = Buffer.from(hex, 'hex');
    if (seed.length !== 32) throw new Error('ORACLE_PRIVATE_KEY_HEX must be 32 bytes (64 hex chars)');
    return seed;
}

function getKeyPair() {
    const seed = parsePrivateKey();
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

function signClaimHash(cell) {
    const kp = getKeyPair();
    const hash = cell.hash(); // Buffer(32)
    const sig = nacl.sign.detached(new Uint8Array(hash), kp.secretKey);
    return Buffer.from(sig);
}

function createSignedClaim({ vaultAddress, jettonMaster, to, amount, seqno, validUntil }) {
    const payloadCell = buildClaimPayload({ vaultAddress, jettonMaster, to, amount, seqno, validUntil });
    const signature = signClaimHash(payloadCell);

    return {
        payloadBocBase64: payloadCell.toBoc().toString('base64'),
        signatureBase64: signature.toString('base64'),
    };
}

module.exports = { createSignedClaim };

